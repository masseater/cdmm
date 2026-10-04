import { API_INPUTS, API_METHODS } from "@claude-max-manager/core";
import type { ApiMethod, ApiOutputs } from "@claude-max-manager/core";
import { Effect, Option, Schema } from "effect";
import type { Layer } from "effect";
import { ipcMain } from "electron";

import { ManagerError } from "./errors.ts";
import type { AppLayer } from "./layers.ts";
import { handlers } from "./manager.ts";
import type { ManagerServices } from "./services.ts";
import type { Ui } from "./ui.ts";

const FILE_PROTOCOL = "file:";

const READ_ONLY: ReadonlySet<ApiMethod> = new Set<ApiMethod>(["overview", "pendingChoice"]);

const callApi = <Method extends ApiMethod>(
  input: Readonly<{ method: Method; argument: unknown }>,
): Effect.Effect<ApiOutputs[Method], Schema.SchemaError, ManagerServices> =>
  Schema.decodeUnknownEffect(API_INPUTS[input.method])(input.argument).pipe(
    Effect.flatMap((decoded) => handlers[input.method](decoded)),
  );

const isMutation = (method: ApiMethod): boolean => !READ_ONLY.has(method);

const isTrustedSender = (url: Option.Option<string>): boolean =>
  url.pipe(
    Option.map((value) => URL.canParse(value) && new URL(value).protocol === FILE_PROTOCOL),
    Option.getOrElse(() => false),
  );

const guardedCall = Effect.fn("guardedCall")(function* guardedCall(
  input: Readonly<{ sender: Option.Option<string>; method: ApiMethod; argument: unknown; ui: Ui }>,
) {
  if (!isTrustedSender(input.sender)) {
    return yield* new ManagerError({ message: "untrusted sender" });
  }
  const result = yield* callApi({ method: input.method, argument: input.argument });
  if (isMutation(input.method)) {
    input.ui.notify();
  }
  return result;
});

type Run = <Value, Failure>(
  effect: Effect.Effect<Value, Failure, Layer.Success<AppLayer>>,
) => Promise<Value>;

const registerIpc = (input: Readonly<{ run: Run; ui: Ui }>): void => {
  for (const method of API_METHODS) {
    ipcMain.handle(`cmm:${method}`, (event, argument: unknown) => {
      const sender = Option.fromNullishOr(event.senderFrame).pipe(Option.map((frame) => frame.url));
      return input.run(guardedCall({ sender, method, argument, ui: input.ui }));
    });
  }
};

export type { Run };
export { registerIpc };
