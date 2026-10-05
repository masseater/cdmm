import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { Layer } from "effect";
import type { Config } from "effect";
import type { ChildProcessSpawner } from "effect/process";

import { unsupportedLayer, windowsLayer } from "./desktop.ts";
import { hostLayer } from "./electron-host.ts";
import type { ManagerServices } from "./services.ts";
import { sessionLayer } from "./session.ts";
import { storeLayer } from "./store.ts";
import type { Ui } from "./ui.ts";

const desktopLayer = (): ReturnType<typeof windowsLayer> => {
  if (process.platform === "win32") {
    return windowsLayer(process.execPath);
  }
  return unsupportedLayer;
};

type AppLayer = Layer.Layer<
  ManagerServices | ChildProcessSpawner.ChildProcessSpawner,
  Config.ConfigError
>;

const appLayer = (ui: Ui): AppLayer =>
  Layer.mergeAll(storeLayer, sessionLayer, desktopLayer()).pipe(
    Layer.provideMerge(hostLayer(ui)),
    Layer.provideMerge(nodeServicesLayer),
  );

export type { AppLayer };
export { appLayer };
