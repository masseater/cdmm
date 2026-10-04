import { Effect, Layer, String as Str } from "effect";
import { app, safeStorage, shell } from "electron";

import { ManagerError } from "./errors.ts";
import { Host } from "./host.ts";
import type { Ui } from "./ui.ts";

const hostFailure = (cause: unknown): ManagerError => new ManagerError({ message: String(cause) });

const hostLayer = (ui: Ui): Layer.Layer<Host> =>
  Layer.succeed(
    Host,
    Host.of({
      appData: app.getPath("appData"),
      encrypt: (plain) =>
        Effect.try({
          try: () => safeStorage.encryptString(plain).toString("base64"),
          catch: hostFailure,
        }),
      decrypt: (sealed) =>
        Effect.try({
          try: () => safeStorage.decryptString(Buffer.from(sealed, "base64")),
          catch: hostFailure,
        }),
      openPath: (target) =>
        Effect.tryPromise({ try: () => shell.openPath(target), catch: hostFailure }).pipe(
          Effect.filterOrFail(Str.isEmpty, hostFailure),
          Effect.asVoid,
        ),
      openExternal: (url) =>
        Effect.tryPromise({ try: () => shell.openExternal(url), catch: hostFailure }),
      choicesChanged: Effect.sync(() => {
        ui.showWindow();
        ui.notify();
      }),
    }),
  );

export { hostLayer };
