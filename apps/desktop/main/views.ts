import type { Account, AccountView, Overview } from "@cdmm/core";
import { Clock, Effect, pipe } from "effect";

import { Desktop } from "./desktop.ts";
import { checkIdentity, identityOf, refreshBinding } from "./identity.ts";
import { isRunning } from "./links.ts";
import { Store } from "./store.ts";
import { syncStatus } from "./sync.ts";

const NOT_PENDING = 0;

const viewOf = Effect.fn("viewOf")(function* viewOf(account: Account) {
  const store = yield* Store;
  const identity = yield* identityOf(account.id);
  const current = yield* refreshBinding({ account, identity });
  const paths = yield* store.pathsOf(current.id);
  const state = yield* store.state;
  const now = yield* Clock.currentTimeMillis;
  const secrets = yield* store.secrets(current.id);
  return {
    account: current,
    running: yield* isRunning(current.id),
    waitingForLogin: (state.pendingLogins[current.id] ?? NOT_PENDING) > now,
    identity,
    identityCheck: checkIdentity({ account: current, identity }),
    secretNames: Object.keys(secrets).toSorted(),
    sync: yield* syncStatus(current),
    paths: { desktop: paths.desktop, code: paths.code },
  } satisfies AccountView;
});

const overview = Effect.gen(function* overview() {
  const store = yield* Store;
  const desktop = yield* Desktop;
  const accounts = yield* store.accounts;
  return {
    desktop: yield* desktop.install,
    router: yield* desktop.router,
    presets: yield* store.presets,
    accounts: yield* pipe(
      accounts,
      Effect.forEach((account) => viewOf(account)),
    ),
  } satisfies Overview;
});

export { overview };
