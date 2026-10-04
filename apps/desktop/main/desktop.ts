import type { DesktopInstall, RouterStatus } from "@cdmm/core";
import { Config, Context, Effect, FileSystem, Layer, Option, Path, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { ManagerError } from "./errors.ts";
import { STOP_SCRIPT } from "./powershell.ts";

type DesktopTarget = Readonly<{
  userDataDir: Option.Option<string>;
  codeDir: Option.Option<string>;
  link: Option.Option<string>;
}>;

type DesktopShape = Readonly<{
  install: Effect.Effect<DesktopInstall>;
  router: Effect.Effect<RouterStatus>;
  isRunning: (userDataDir: string) => Effect.Effect<boolean>;
  launch: (target: DesktopTarget) => Effect.Effect<void, ManagerError>;
  stop: (userDataDir: string) => Effect.Effect<void, ManagerError>;
  launchCode: (
    input: Readonly<{ codeDir: string; title: string }>,
  ) => Effect.Effect<void, ManagerError>;
  registerRouter: Effect.Effect<void, ManagerError>;
  defaultAppsSettings: string;
}>;

class Desktop extends Context.Service<Desktop, DesktopShape>()("@cdmm/desktop/main/desktop") {}

const PACKAGE_NAME = "Claude";
const ALIAS = "claude-desktop.exe";
const PROG_ID = "cdmm.Url";
const APP_NAME = "cdmm";
const APP_KEY = String.raw`HKCU\Software\cdmm`;
const CLASSES_KEY = String.raw`HKCU\Software\Classes\cdmm.Url`;
const REGISTERED_APPS = String.raw`HKCU\Software\RegisteredApplications`;
const ASSOCIATION = String.raw`HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\claude`;
const TESTED_VERSIONS: readonly string[] = ["2.19675."];
const EXIT_OK = 0;
const UNSAFE_TITLE = /[^\p{L}\p{N} ._-]/gu;
const NOT_WINDOWS = "Claude Desktop can only be managed on Windows";

const failed = (message: string): ManagerError => new ManagerError({ message });

const asFailure = (cause: unknown): ManagerError => failed(String(cause));

const desktopArgs = (target: DesktopTarget): readonly string[] => [
  ...Option.toArray(target.userDataDir.pipe(Option.map((dir) => `--user-data-dir=${dir}`))),
  ...Option.toArray(target.link),
];

const codeEnv = (target: DesktopTarget): Readonly<Record<string, string>> =>
  Option.match(target.codeDir, {
    onNone: () => ({}),
    onSome: (dir) => ({ CLAUDE_CONFIG_DIR: dir }),
  });

const routeCommand = (executable: string): string => `"${executable}" --route -- "%1"`;

const registryEntries = (executable: string): readonly (readonly string[])[] => [
  [CLASSES_KEY, "/ve", "/d", "URL:Claude (Claude Max Desktop Manager)"],
  [CLASSES_KEY, "/v", "URL Protocol", "/d", ""],
  [String.raw`${CLASSES_KEY}\DefaultIcon`, "/ve", "/d", executable],
  [String.raw`${CLASSES_KEY}\shell\open\command`, "/ve", "/d", routeCommand(executable)],
  [
    String.raw`${APP_KEY}\Capabilities`,
    "/v",
    "ApplicationName",
    "/d",
    "Claude Max Desktop Manager",
  ],
  [
    String.raw`${APP_KEY}\Capabilities`,
    "/v",
    "ApplicationDescription",
    "/d",
    "Opens claude:// links in the Claude account they belong to",
  ],
  [String.raw`${APP_KEY}\Capabilities\URLAssociations`, "/v", "claude", "/d", PROG_ID],
  [REGISTERED_APPS, "/v", APP_NAME, "/d", String.raw`Software\cdmm\Capabilities`],
];

const codeArgs = (title: string): readonly string[] => [
  "/c",
  "start",
  title.replaceAll(UNSAFE_TITLE, ""),
  "powershell.exe",
  "-NoExit",
  "-Command",
  "claude",
];

const powershellArgs = (script: string): readonly string[] => [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  script,
];

type Invocation = Readonly<{
  command: string;
  args: readonly string[];
  env: Readonly<Record<string, string>>;
}>;

const output = Effect.fn("Desktop.output")(function* output(
  input: Readonly<{ command: string; args: readonly string[] }>,
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const command = ChildProcess.make(input.command, [...input.args], { windowsHide: true });
  return yield* spawner.string(command).pipe(
    Effect.map(Str.trim),
    Effect.orElseSucceed(() => ""),
  );
});

const checked = Effect.fn("Desktop.checked")(function* checked(input: Invocation) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const command = ChildProcess.make(input.command, [...input.args], {
    windowsHide: true,
    env: { ...input.env },
    extendEnv: true,
  });
  return yield* spawner.exitCode(command).pipe(
    Effect.mapError(asFailure),
    Effect.filterOrFail(
      (code) => code === EXIT_OK,
      (code) => failed(`${input.command} exited with ${String(code)}`),
    ),
    Effect.asVoid,
  );
});

const detached = Effect.fn("Desktop.detached")(function* detached(input: Invocation) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const command = ChildProcess.make(input.command, [...input.args], {
    detached: true,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: { ...input.env },
    extendEnv: true,
  });
  const handle = yield* spawner.spawn(command).pipe(Effect.mapError(asFailure));
  yield* handle.unref.pipe(Effect.mapError(asFailure), Effect.asVoid);
}, Effect.scoped);

const installAt = Effect.fn("Desktop.install")(function* installAt(alias: string) {
  const fs = yield* FileSystem.FileSystem;
  const present = yield* fs.exists(alias).pipe(Effect.orElseSucceed(() => false));
  if (!present) {
    return { status: "missing" } satisfies DesktopInstall;
  }
  const version = yield* output({
    command: "powershell.exe",
    args: powershellArgs(
      `(Get-AppxPackage -Name ${PACKAGE_NAME} | Sort-Object Version -Descending | Select-Object -First 1).Version`,
    ),
  });
  return {
    status: "found",
    version,
    testedVersion: TESTED_VERSIONS.some((prefix) => version.startsWith(prefix)),
  } satisfies DesktopInstall;
});

const queryValue = (
  key: string,
  name: string,
): Effect.Effect<string, never, ChildProcessSpawner.ChildProcessSpawner> =>
  output({ command: "reg.exe", args: ["query", key, "/v", name] });

const routerStatus = Effect.fn("Desktop.routerStatus")(function* routerStatus(executable: string) {
  const command = yield* output({
    command: "reg.exe",
    args: ["query", String.raw`${CLASSES_KEY}\shell\open\command`, "/ve"],
  });
  const registered = yield* queryValue(REGISTERED_APPS, APP_NAME);
  if (!command.includes(routeCommand(executable)) || !registered.includes(APP_NAME)) {
    return { status: "unregistered" } satisfies RouterStatus;
  }
  const latest = yield* queryValue(String.raw`${ASSOCIATION}\UserChoiceLatest\ProgId`, "ProgId");
  const legacy = yield* queryValue(String.raw`${ASSOCIATION}\UserChoice`, "ProgId");
  if (`${latest}${legacy}`.includes(PROG_ID)) {
    return { status: "active" } satisfies RouterStatus;
  }
  return { status: "registered" } satisfies RouterStatus;
});

const isRunning = Effect.fn("Desktop.isRunning")(function* isRunning(userDataDir: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  return yield* Effect.scoped(fs.open(path.join(userDataDir, "lockfile"), { flag: "r+" })).pipe(
    Effect.as(false),
    Effect.catchReason(
      "PlatformError",
      "NotFound",
      () => Effect.succeed(false),
      () => Effect.succeed(true),
    ),
  );
});

const registerRouterFor = (
  executable: string,
): Effect.Effect<void, ManagerError, ChildProcessSpawner.ChildProcessSpawner> =>
  Effect.forEach(
    registryEntries(executable),
    (entry) => checked({ command: "reg.exe", args: ["add", ...entry, "/f"], env: {} }),
    { discard: true },
  );

type WindowsServices = ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem | Path.Path;

const windowsLayer = (
  executable: string,
): Layer.Layer<Desktop, Config.ConfigError, WindowsServices> =>
  Layer.effect(
    Desktop,
    Effect.gen(function* windowsDesktop() {
      const path = yield* Path.Path;
      const context = yield* Effect.context<WindowsServices>();
      const run = <Value, Failure>(
        effect: Effect.Effect<Value, Failure, WindowsServices>,
      ): Effect.Effect<Value, Failure> => Effect.provideContext(effect, context);
      const localAppData = yield* Config.String("LOCALAPPDATA");
      const alias = path.join(localAppData, "Microsoft", "WindowsApps", ALIAS);
      return Desktop.of({
        install: run(installAt(alias)),
        router: run(routerStatus(executable)),
        isRunning: (userDataDir) => run(isRunning(userDataDir)),
        launch: (target) =>
          run(detached({ command: alias, args: desktopArgs(target), env: codeEnv(target) })),
        stop: (userDataDir) =>
          run(
            checked({
              command: "powershell.exe",
              args: powershellArgs(STOP_SCRIPT),
              env: { CMM_USER_DATA_DIR: userDataDir },
            }),
          ),
        launchCode: (input) =>
          run(
            detached({
              command: "cmd.exe",
              args: codeArgs(input.title),
              env: { CLAUDE_CONFIG_DIR: input.codeDir },
            }),
          ),
        registerRouter: run(registerRouterFor(executable)),
        defaultAppsSettings: `ms-settings:defaultapps?registeredAppUser=${APP_NAME}`,
      });
    }),
  );

const unsupported = Effect.fail(failed(NOT_WINDOWS));

const unsupportedLayer = Layer.succeed(
  Desktop,
  Desktop.of({
    install: Effect.succeed({ status: "unsupported-platform" }),
    router: Effect.succeed({ status: "unsupported-platform" }),
    isRunning: () => Effect.succeed(false),
    launch: () => unsupported,
    stop: () => unsupported,
    launchCode: () => unsupported,
    registerRouter: unsupported,
    defaultAppsSettings: "",
  }),
);

export type { WindowsServices };
export { Desktop, unsupportedLayer, windowsLayer };
