import type { ApiInput } from "@cdmm/core";
import { Clock, Effect, FileSystem, Option } from "effect";

import { Desktop } from "./desktop.ts";
import { Host } from "./host.ts";
import { findAccount, startDesktop } from "./links.ts";
import { Store } from "./store.ts";
import { syncAccount } from "./sync.ts";

const LOGIN_WAIT_MS = 600_000;

const launchDesktop = Effect.fn("launchDesktop")(function* launchDesktop(accountId: string) {
  const account = yield* findAccount(accountId);
  yield* syncAccount(account);
  yield* startDesktop({ account, link: Option.none() });
});

const signIn = Effect.fn("signIn")(function* signIn(accountId: string) {
  const store = yield* Store;
  const account = yield* findAccount(accountId);
  const state = yield* store.state;
  const now = yield* Clock.currentTimeMillis;
  yield* store.saveState({
    ...state,
    pendingLogins: { ...state.pendingLogins, [account.id]: now + LOGIN_WAIT_MS },
  });
  yield* launchDesktop(account.id);
});

const stopDesktop = Effect.fn("stopDesktop")(function* stopDesktop(accountId: string) {
  const store = yield* Store;
  const desktop = yield* Desktop;
  const paths = yield* store.pathsOf((yield* findAccount(accountId)).id);
  yield* desktop.stop(paths.desktop);
});

const launchCode = Effect.fn("launchCode")(function* launchCode(accountId: string) {
  const store = yield* Store;
  const desktop = yield* Desktop;
  const fs = yield* FileSystem.FileSystem;
  const account = yield* findAccount(accountId);
  const paths = yield* store.pathsOf(account.id);
  yield* syncAccount(account);
  yield* fs.makeDirectory(paths.code, { recursive: true });
  yield* desktop.launchCode({ codeDir: paths.code, title: `Claude Code ${account.label}` });
});

const openFolder = Effect.fn("openFolder")(function* openFolder(accountId: string) {
  const store = yield* Store;
  const host = yield* Host;
  const paths = yield* store.pathsOf((yield* findAccount(accountId)).id);
  yield* host.openPath(paths.root);
});

const registerRouter = Effect.gen(function* registerRouter() {
  const desktop = yield* Desktop;
  const host = yield* Host;
  yield* desktop.registerRouter;
  yield* host.openExternal(desktop.defaultAppsSettings);
});

const fitWindow = Effect.fn("fitWindow")(function* fitWindow(mode: ApiInput<"fitWindow">) {
  const host = yield* Host;
  yield* host.fitWindow(mode);
});

export { fitWindow, launchCode, launchDesktop, openFolder, registerRouter, signIn, stopDesktop };
