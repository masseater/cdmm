import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { Context, Effect, FileSystem, Layer, Ref } from "effect";
import { Base64 } from "effect/encoding";

import { Desktop } from "./desktop.ts";
import { ManagerError } from "./errors.ts";
import { Host } from "./host.ts";
import { sessionLayer } from "./session.ts";
import { storeLayer } from "./store.ts";

type LaunchTarget = Desktop["Service"]["launch"] extends (target: infer Target) => unknown
  ? Target
  : never;

type RecorderShape = Readonly<{
  launched: Ref.Ref<readonly LaunchTarget[]>;
  running: Ref.Ref<ReadonlySet<string>>;
}>;

class Recorder extends Context.Service<Recorder, RecorderShape>()(
  "@claude-max-manager/desktop/main/harness.test.helpers/Recorder",
) {}

const SEALED = "sealed:";

const recorderLayer = Layer.effect(
  Recorder,
  Effect.gen(function* makeRecorder() {
    const launched = yield* Ref.make<readonly LaunchTarget[]>([]);
    const running = yield* Ref.make<ReadonlySet<string>>(new Set());
    return Recorder.of({ launched, running });
  }),
);

const unseal = (sealed: string): Effect.Effect<string, ManagerError> =>
  Effect.fromResult(Base64.decodeString(sealed.slice(SEALED.length))).pipe(
    Effect.mapError((failure) => new ManagerError({ message: failure.message })),
  );

const hostLayer = Layer.effect(
  Host,
  Effect.gen(function* makeHost() {
    const fs = yield* FileSystem.FileSystem;
    const appData = yield* fs.makeTempDirectoryScoped();
    return Host.of({
      appData,
      encrypt: (plain) => Effect.succeed(`${SEALED}${Base64.encode(plain)}`),
      decrypt: unseal,
      openPath: () => Effect.void,
      openExternal: () => Effect.void,
      choicesChanged: Effect.void,
    });
  }),
);

const desktopLayer = Layer.effect(
  Desktop,
  Effect.gen(function* makeDesktop() {
    const recorder = yield* Recorder;
    return Desktop.of({
      install: Effect.succeed({ status: "found", version: "2.19675.0.0", testedVersion: true }),
      router: Effect.succeed({ status: "active" }),
      isRunning: (dir) => Ref.get(recorder.running).pipe(Effect.map((dirs) => dirs.has(dir))),
      launch: (target) => Ref.update(recorder.launched, (all) => [...all, target]),
      stop: () => Effect.void,
      launchCode: () => Effect.void,
      registerRouter: Effect.void,
      defaultAppsSettings: "",
    });
  }),
);

const testLayer = Layer.mergeAll(storeLayer, sessionLayer, desktopLayer).pipe(
  Layer.provideMerge(hostLayer),
  Layer.provideMerge(recorderLayer),
  Layer.provideMerge(nodeServicesLayer),
);

type TestServices = Layer.Success<typeof testLayer>;

const runTest = <Value, Failure>(
  program: Effect.Effect<Value, Failure, TestServices>,
): Promise<Value> => {
  const provided = Layer.build(testLayer).pipe(
    Effect.flatMap((context) => Effect.provideContext(program, context)),
  );
  return Effect.runPromise(Effect.scoped(provided));
};

export type { TestServices };
export { Recorder, runTest };
