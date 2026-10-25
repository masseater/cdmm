import { Effect, Ref } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Recorder, runTest } from "./harness.test.helpers.ts";
import { handlers } from "./manager.ts";
import { createAccount } from "./scenario.test.helpers.ts";

describe("driving an account's hidden Desktop", () => {
  it("reads the account's own hidden desktop", () =>
    runTest(
      Effect.gen(function* read() {
        const account = yield* createAccount({ label: "A", presetId: "default" });
        const screen = yield* handlers.readScreen(account.id);
        expect(screen).toStrictEqual({ status: "read", text: `screen:cdmm-${account.id}` });
      }),
    ));

  it("sends text to the account's own hidden desktop", () =>
    runTest(
      Effect.gen(function* send() {
        const recorder = yield* Recorder;
        const account = yield* createAccount({ label: "A", presetId: "default" });
        const done = yield* handlers.sendText({ accountId: account.id, text: "hello" });
        expect(done).toStrictEqual({ status: "done" });
        expect(yield* Ref.get(recorder.sent)).toStrictEqual([
          { desktop: `cdmm-${account.id}`, text: "hello" },
        ]);
      }),
    ));

  it("reports failure for an unknown account", () =>
    runTest(
      Effect.gen(function* missing() {
        const screen = yield* handlers.readScreen("does-not-exist");
        expect(screen.status).toBe("failed");
      }),
    ));
});
