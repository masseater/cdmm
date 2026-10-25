import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { Context, Effect, Layer, String as Str } from "effect";
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

type OutputInput = Readonly<{ command: string; args: readonly string[] }>;

type ProcessesShape = Readonly<{
  output: (input: OutputInput) => Effect.Effect<string>;
  checked: (input: Invocation) => Effect.Effect<void, ManagerError>;
  detached: (input: Invocation) => Effect.Effect<void, ManagerError>;
}>;

class Processes extends Context.Service<Processes, ProcessesShape>()(
  "@cdmm/desktop/main/spawn/Processes",
) {}

const processesLayer: Layer.Layer<Processes> = Layer.effect(
  Processes,
  Effect.gen(function* makeProcesses() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const output = Effect.fn("Desktop.output")(function* output(input: OutputInput) {
      const command = ChildProcess.make(input.command, [...input.args], { windowsHide: true });
      return yield* spawner.string(command).pipe(
        Effect.map(Str.trim),
        Effect.orElseSucceed(() => ""),
      );
    });

    const checked = Effect.fn("Desktop.checked")(function* checked(input: Invocation) {
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

    return Processes.of({ output, checked, detached });
  }),
).pipe(Layer.provide(nodeServicesLayer));

const output = Effect.fn("Processes.output")(function* output(input: OutputInput) {
  const processes = yield* Processes;
  return yield* processes.output(input);
});

const checked = Effect.fn("Processes.checked")(function* checked(input: Invocation) {
  const processes = yield* Processes;
  yield* processes.checked(input);
});

const detached = Effect.fn("Processes.detached")(function* detached(input: Invocation) {
  const processes = yield* Processes;
  yield* processes.detached(input);
});

export type { Invocation, OutputInput };
export { asFailure, checked, detached, failed, output, powershellArgs, Processes, processesLayer };
