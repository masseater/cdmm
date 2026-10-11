import type { DesktopInstall, RouterStatus } from "@cdmm/core";
import { Config, Context, Effect, FileSystem, Layer, Option, Path, String as Str } from "effect";
import type { ChildProcessSpawner } from "effect/process";

import type { ManagerError } from "./errors.ts";
import { READ_BODY, SEND_BODY, STOP_SCRIPT } from "./powershell.ts";
import { defaultAppsSettings, registerRouterFor, routerStatus } from "./router.ts";
import { asFailure, checked, detached, failed, output, powershellArgs } from "./spawn.ts";
import { win32 } from "./win32.ts";

type DesktopTarget = Readonly<{
  userDataDir: Option.Option<string>;
  codeDir: Option.Option<string>;
  link: Option.Option<string>;
  desktop: Option.Option<string>;
}>;

type DesktopShape = Readonly<{
  install: Effect.Effect<DesktopInstall>;
  router: Effect.Effect<RouterStatus>;
  isRunning: (userDataDir: string) => Effect.Effect<boolean>;
  launch: (target: DesktopTarget) => Effect.Effect<void, ManagerError>;
  stop: (userDataDir: string) => Effect.Effect<void, ManagerError>;
  read: (input: Readonly<{ desktop: string }>) => Effect.Effect<string, ManagerError>;
  send: (input: Readonly<{ desktop: string; text: string }>) => Effect.Effect<void, ManagerError>;
  launchCode: (
    input: Readonly<{ codeDir: string; title: string }>,
  ) => Effect.Effect<void, ManagerError>;
  registerRouter: Effect.Effect<void, ManagerError>;
  defaultAppsSettings: string;
}>;

class Desktop extends Context.Service<Desktop, DesktopShape>()("@cdmm/desktop/main/desktop") {}

type WindowsServices = ChildProcessSpawner.ChildProcessSpawner | FileSystem.FileSystem | Path.Path;
type Run = <Value, Failure>(
  effect: Effect.Effect<Value, Failure, WindowsServices>,
) => Effect.Effect<Value, Failure>;

const PACKAGE_NAME = "Claude";
const ALIAS = "claude-desktop.exe";
const TESTED_VERSIONS: readonly string[] = ["2.19675."];
const LAUNCH_WAIT_MS = 20_000;
const DRIVE_TIMEOUT_MS = 40_000;
const UNSAFE_TITLE = /[^\p{L}\p{N} ._-]/gu;
const NOT_WINDOWS = "Claude Desktop can only be managed on Windows";

const desktopArgs = (target: DesktopTarget): readonly string[] => [
  ...Option.toArray(target.userDataDir.pipe(Option.map((dir) => `--user-data-dir=${dir}`))),
  ...Option.toArray(target.link),
];

const codeEnv = (target: DesktopTarget): Readonly<Record<string, string>> =>
  Option.match(target.codeDir, {
    onNone: () => ({}),
    onSome: (dir) => ({ CLAUDE_CONFIG_DIR: dir }),
  });

const launchArgs = (target: DesktopTarget): Readonly<{ userDataDir: string; link: string }> => ({
  userDataDir: Option.getOrElse(target.userDataDir, () => ""),
  link: Option.getOrElse(target.link, () => ""),
});

const launchCommand = (
  input: Readonly<{ alias: string; userDataDir: string; link: string }>,
): string => {
  const base = `"${input.alias}" --user-data-dir="${input.userDataDir}" --force-renderer-accessibility`;
  if (input.link === "") {
    return base;
  }
  return `${base} "${input.link}"`;
};

const bodyCommand = (file: string): string =>
  `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${file}"`;

const codeArgs = (title: string): readonly string[] => [
  "/c",
  "start",
  title.replaceAll(UNSAFE_TITLE, ""),
  "powershell.exe",
  "-NoExit",
  "-Command",
  "claude",
];

const launchHidden = Effect.fn("Desktop.launchHidden")(function* launchHidden(
  input: Readonly<{ desktop: string; cmd: string; env: Readonly<Record<string, string>> }>,
) {
  yield* win32.launch({ ...input, waitMs: LAUNCH_WAIT_MS }).pipe(Effect.mapError(asFailure));
});

const launchEffect = (
  input: Readonly<{ alias: string; target: DesktopTarget }>,
): Effect.Effect<void, ManagerError, ChildProcessSpawner.ChildProcessSpawner> =>
  Option.match(input.target.desktop, {
    onNone: () =>
      detached({
        command: input.alias,
        args: desktopArgs(input.target),
        env: codeEnv(input.target),
      }),
    onSome: (desktop) =>
      launchHidden({
        desktop,
        cmd: launchCommand({ alias: input.alias, ...launchArgs(input.target) }),
        env: codeEnv(input.target),
      }),
  });

const readOutput = Effect.fn("Desktop.readOutput")(function* readOutput(outFile: string) {
  const fs = yield* FileSystem.FileSystem;
  const present = yield* fs.exists(outFile).pipe(Effect.orElseSucceed(() => false));
  if (!present) {
    return "";
  }
  return yield* fs.readFileString(outFile).pipe(
    Effect.map(Str.trim),
    Effect.orElseSucceed(() => ""),
  );
});

const drive = Effect.fn("Desktop.drive")(function* drive(
  input: Readonly<{ desktop: string; body: string; env: Readonly<Record<string, string>> }>,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dir = yield* fs.makeTempDirectoryScoped().pipe(Effect.mapError(asFailure));
  const bodyFile = path.join(dir, "body.ps1");
  const outFile = path.join(dir, "out.txt");
  yield* fs.writeFileString(bodyFile, input.body).pipe(Effect.mapError(asFailure));
  yield* win32
    .run({
      desktop: input.desktop,
      cmd: bodyCommand(bodyFile),
      env: { ...input.env, CMM_OUT: outFile },
      timeoutMs: DRIVE_TIMEOUT_MS,
    })
    .pipe(Effect.mapError(asFailure));
  return yield* readOutput(outFile);
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

const makeWindowsDesktop = (
  deps: Readonly<{ executable: string; alias: string; run: Run }>,
): DesktopShape => {
  const { executable, alias, run } = deps;
  return {
    install: run(installAt(alias)),
    router: run(routerStatus(executable)),
    isRunning: (userDataDir) => run(isRunning(userDataDir)),
    launch: (target) => run(launchEffect({ alias, target })),
    stop: (userDataDir) =>
      run(
        checked({
          command: "powershell.exe",
          args: powershellArgs(STOP_SCRIPT),
          env: { CMM_USER_DATA_DIR: userDataDir },
        }),
      ),
    read: (input) => run(drive({ desktop: input.desktop, body: READ_BODY, env: {} })),
    send: (input) =>
      run(
        drive({ desktop: input.desktop, body: SEND_BODY, env: { CMM_TEXT: input.text } }).pipe(
          Effect.asVoid,
        ),
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
    defaultAppsSettings,
  };
};

const windowsLayer = (
  executable: string,
): Layer.Layer<Desktop, Config.ConfigError, WindowsServices> =>
  Layer.effect(
    Desktop,
    Effect.gen(function* windowsDesktop() {
      const path = yield* Path.Path;
      const context = yield* Effect.context<WindowsServices>();
      const run: Run = (effect) => Effect.provideContext(effect, context);
      const localAppData = yield* Config.String("LOCALAPPDATA");
      const alias = path.join(localAppData, "Microsoft", "WindowsApps", ALIAS);
      return Desktop.of(makeWindowsDesktop({ executable, alias, run }));
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
    read: () => unsupported,
    send: () => unsupported,
    launchCode: () => unsupported,
    registerRouter: unsupported,
    defaultAppsSettings: "",
  }),
);

export type { WindowsServices };
export { Desktop, unsupportedLayer, windowsLayer };
