import { Effect, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { ManagerError } from "./errors.ts";

const EXIT_OK = 0;

const failed = (message: string): ManagerError => new ManagerError({ message });

const asFailure = (cause: unknown): ManagerError => failed(String(cause));

type Invocation = Readonly<{
  command: string;
  args: readonly string[];
  env: Readonly<Record<string, string>>;
}>;

const powershellArgs = (script: string): readonly string[] => [
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  script,
];

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

export type { Invocation };
export { asFailure, checked, detached, failed, output, powershellArgs };
