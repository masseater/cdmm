import type { Account } from "@claude-max-manager/core";
import { Effect, Option, Ref } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Recorder, runTest } from "./harness.test.helpers.ts";
import { handleLink } from "./links.ts";
import { handlers } from "./manager.ts";
import { createAccount, setRunning, signInAs } from "./scenario.test.helpers.ts";
import { Store } from "./store.ts";

const LAST = -1;
const LOGIN = "claude://login/google-auth?code=abc";
const GENERAL = "claude://claude.ai/new?q=hello";

const lastLaunch = Effect.gen(function* lastLaunch() {
  const recorder = yield* Recorder;
  const launched = yield* Ref.get(recorder.launched);
  return Option.fromNullishOr(launched.at(LAST));
});

const desktopDirOf = Effect.fn("desktopDirOf")(function* desktopDirOf(account: Account) {
  const store = yield* Store;
  const paths = yield* store.pathsOf(account.id);
  return paths.desktop;
});

const codeDirOf = Effect.fn("codeDirOf")(function* codeDirOf(account: Account) {
  const store = yield* Store;
  const paths = yield* store.pathsOf(account.id);
  return paths.code;
});

const identityCheckOf = Effect.fn("identityCheckOf")(function* identityCheckOf(account: Account) {
  const view = yield* handlers.overview();
  const found = Option.fromNullishOr(view.accounts.find((each) => each.account.id === account.id));
  return found.pipe(Option.map((each) => each.identityCheck));
});

const twoSignedIn = Effect.gen(function* twoSignedIn() {
  const first = yield* createAccount({ label: "A", presetId: "default" });
  const second = yield* createAccount({ label: "B", presetId: "default" });
  yield* signInAs({ account: first, uuid: "uuid-a" });
  yield* signInAs({ account: second, uuid: "uuid-b" });
  yield* setRunning([first, second]);
  return { first, second };
});

describe("launching an account", () => {
  it("starts Desktop and Claude Code inside that account's own directories", () =>
    runTest(
      Effect.gen(function* launch() {
        const account = yield* createAccount({ label: "A", presetId: "default" });
        yield* handlers.launchDesktop(account.id);
        const target = Option.getOrThrow(yield* lastLaunch);
        expect(target.userDataDir).toStrictEqual(Option.some(yield* desktopDirOf(account)));
        expect(target.codeDir).toStrictEqual(Option.some(yield* codeDirOf(account)));
      }),
    ));
});

describe("login callbacks", () => {
  it("go to the account that asked to sign in", () =>
    runTest(
      Effect.gen(function* loginRoute() {
        yield* createAccount({ label: "A", presetId: "default" });
        const second = yield* createAccount({ label: "B", presetId: "default" });
        yield* handlers.signIn(second.id);
        yield* handleLink(LOGIN);
        const target = Option.getOrThrow(yield* lastLaunch);
        expect(target.userDataDir).toStrictEqual(Option.some(yield* desktopDirOf(second)));
        expect(target.link).toStrictEqual(Option.some(LOGIN));
      }),
    ));

  it("wait for the user when nobody asked to sign in", () =>
    runTest(
      Effect.gen(function* loginAsk() {
        yield* twoSignedIn;
        yield* handleLink(LOGIN);
        const pending = yield* handlers.pendingChoice();
        expect(pending.map((choice) => choice.link)).toStrictEqual([LOGIN]);
        expect(yield* lastLaunch).toStrictEqual(Option.none());
      }),
    ));
});

describe("choosing an account for a waiting link", () => {
  it("delivers the link to the chosen account and clears it", () =>
    runTest(
      Effect.gen(function* choose() {
        const { second } = yield* twoSignedIn;
        yield* handleLink(LOGIN);
        yield* handlers.choose({ link: LOGIN, accountId: second.id });
        const target = Option.getOrThrow(yield* lastLaunch);
        expect(target.userDataDir).toStrictEqual(Option.some(yield* desktopDirOf(second)));
        expect(yield* handlers.pendingChoice()).toStrictEqual([]);
      }),
    ));
});

describe("general links", () => {
  it("go to the account used last", () =>
    runTest(
      Effect.gen(function* generalRoute() {
        const { first } = yield* twoSignedIn;
        yield* handlers.launchDesktop(first.id);
        yield* handleLink(GENERAL);
        const target = Option.getOrThrow(yield* lastLaunch);
        expect(target.userDataDir).toStrictEqual(Option.some(yield* desktopDirOf(first)));
      }),
    ));
});

describe("identity", () => {
  it("binds the first signed-in identity and flags a different one later", () =>
    runTest(
      Effect.gen(function* identity() {
        const { first } = yield* twoSignedIn;
        const before = yield* identityCheckOf(first);
        yield* signInAs({ account: first, uuid: "uuid-other" });
        const after = yield* identityCheckOf(first);
        expect(before).toStrictEqual(Option.some({ status: "matching" }));
        expect(after).toStrictEqual(
          Option.some({
            status: "mismatch",
            expected: "uuid-a",
            actual: "uuid-other",
          }),
        );
      }),
    ));
});
