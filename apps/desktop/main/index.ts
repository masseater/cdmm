import { layer as nodePathLayer } from "@effect/platform-node/NodePath";
import { Effect, Layer, ManagedRuntime, Path } from "effect";
import { app } from "electron";

import { registerIpc } from "./ipc.ts";
import { appLayer } from "./layers.ts";
import { handleRequest, requestFrom } from "./requests.ts";
import type { LaunchRequest } from "./requests.ts";
import { createTray, makeUi } from "./ui.ts";
import type { Locations } from "./ui.ts";

const APP_ID = "com.masseater.claude-max-manager";

const locate = Effect.gen(function* locate() {
  const path = yield* Path.Path;
  const here = yield* path.fromFileUrl(new URL(".", import.meta.url));
  const assets = path.join(here, "..", "..", "assets");
  return {
    preload: path.join(here, "preload.cjs"),
    renderer: path.join(here, "..", "renderer", "index.html"),
    icon: path.join(assets, "icon.png"),
    tray: path.join(assets, "tray.png"),
  } satisfies Locations;
});

const isOneShot = (request: LaunchRequest): boolean => request.kind !== "open";

const start = (
  input: Readonly<{ locations: Locations; initial: LaunchRequest }>,
): Promise<void> => {
  const ui = makeUi(input.locations);
  const runtime = ManagedRuntime.make(appLayer(ui));
  registerIpc({ run: (effect) => runtime.runPromise(effect), ui });
  createTray({ locations: input.locations, ui });
  app.on("second-instance", (_event, argv) => {
    runtime.runFork(handleRequest({ request: requestFrom(argv), ui }));
  });
  app.on("window-all-closed", () => {
    runtime.runFork(Effect.logInfo("window closed, staying in the tray"));
  });
  return runtime.runPromise(handleRequest({ request: input.initial, ui }));
};

const boot = Effect.gen(function* boot() {
  const initial = requestFrom(process.argv);
  app.setAppUserModelId(APP_ID);
  yield* Effect.promise(() => app.whenReady());
  const locations = yield* locate;
  yield* Effect.promise(() => start({ locations, initial }));
  if (isOneShot(initial)) {
    app.quit();
  }
});

const main = Layer.effectDiscard(boot).pipe(Layer.provide(nodePathLayer));

if (app.requestSingleInstanceLock()) {
  Effect.runFork(Layer.launch(main));
} else {
  app.quit();
}
