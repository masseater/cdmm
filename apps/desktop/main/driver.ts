import type { ApiInput, Screen } from "@cdmm/core";
import { Effect } from "effect";

import { Desktop } from "./desktop.ts";
import { findAccount } from "./links.ts";
import { desktopName } from "./paths.ts";

const readScreen = Effect.fn("readScreen")(function* readScreen(accountId: string) {
  const desktop = yield* Desktop;
  const account = yield* findAccount(accountId);
  return yield* desktop.read({ desktop: desktopName(account.id) }).pipe(
    Effect.match({
      onSuccess: (text): Screen => ({ status: "read", text }),
      onFailure: (error): Screen => ({ status: "failed", message: error.message }),
    }),
  );
});

const sendText = Effect.fn("sendText")(function* sendText(input: ApiInput<"sendText">) {
  const desktop = yield* Desktop;
  const account = yield* findAccount(input.accountId);
  yield* desktop.send({ desktop: desktopName(account.id), text: input.text });
});

export { readScreen, sendText };
