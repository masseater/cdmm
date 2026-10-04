import { decideRoute } from "@claude-max-manager/core";
import type { Account, AccountRuntime, RouteDecision } from "@claude-max-manager/core";
import { Clock, Effect, FileSystem, Match, Option, pipe, Ref, String as Str } from "effect";
import type { Path } from "effect";

import { Desktop } from "./desktop.ts";
import { ManagerError } from "./errors.ts";
import { Host } from "./host.ts";
import { identityOf } from "./identity.ts";
import { Session } from "./session.ts";
import { Store } from "./store.ts";
import type { StoreError } from "./store.ts";

type LinkServices = Store | Desktop | Host | Session | FileSystem.FileSystem | Path.Path;

const findAccount = Effect.fn("findAccount")(function* findAccount(id: string) {
  const store = yield* Store;
  const accounts = yield* store.accounts;
  const found = Option.fromNullishOr(accounts.find((account) => account.id === id));
  if (Option.isNone(found)) {
    return yield* new ManagerError({ message: `unknown account: ${id}` });
  }
  return found.value;
});

const isRunning = Effect.fn("isRunning")(function* isRunning(accountId: string) {
  const store = yield* Store;
  const desktop = yield* Desktop;
  const paths = yield* store.pathsOf(accountId);
  return yield* desktop.isRunning(paths.desktop);
});

const startDesktop = Effect.fn("startDesktop")(function* startDesktop(
  input: Readonly<{ account: Account; link: Option.Option<string> }>,
) {
  const store = yield* Store;
  const desktop = yield* Desktop;
  const fs = yield* FileSystem.FileSystem;
  const paths = yield* store.pathsOf(input.account.id);
  yield* pipe(
    [paths.desktop, paths.code, paths.home.appData, paths.home.localAppData, paths.home.mcpAuth],
    Effect.forEach((dir) => fs.makeDirectory(dir, { recursive: true })),
  );
  yield* desktop.launch({
    userDataDir: Option.some(paths.desktop),
    codeDir: Option.some(paths.code),
    link: input.link,
  });
  const state = yield* store.state;
  yield* store.saveState({ ...state, lastActiveId: input.account.id });
});

const runtimeOf = Effect.fn("runtimeOf")(function* runtimeOf(
  input: Readonly<{ account: Account; pendingLogins: Readonly<Record<string, number>> }>,
) {
  const identity = yield* identityOf(input.account.id);
  return {
    id: input.account.id,
    running: yield* isRunning(input.account.id),
    signedIn: Str.isNonEmpty(identity.desktopAccountUuid),
    pendingLoginUntil: Option.fromNullishOr(input.pendingLogins[input.account.id]),
  } satisfies AccountRuntime;
});

const ask = Effect.fn("ask")(function* ask(
  input: Readonly<{ link: string; candidates: readonly string[] }>,
) {
  const session = yield* Session;
  const host = yield* Host;
  yield* Ref.update(
    session.choices,
    (current) => new Map([...current, [input.link, input.candidates]]),
  );
  yield* host.choicesChanged;
});

const launchDefault = Effect.fn("launchDefault")(function* launchDefault(link: string) {
  const desktop = yield* Desktop;
  yield* desktop.launch({
    userDataDir: Option.none(),
    codeDir: Option.none(),
    link: Option.some(link),
  });
});

const dispatch = (
  input: Readonly<{ decision: RouteDecision; link: string }>,
): Effect.Effect<void, StoreError, LinkServices> =>
  Match.value(input.decision).pipe(
    Match.discriminatorsExhaustive("status")({
      deliver: (decision) =>
        findAccount(decision.accountId).pipe(
          Effect.flatMap((account) => startDesktop({ account, link: Option.some(input.link) })),
          Effect.tap(() =>
            Effect.logInfo("delivered claude:// link").pipe(
              Effect.annotateLogs({ accountId: decision.accountId }),
            ),
          ),
        ),
      "deliver-default": () =>
        launchDefault(input.link).pipe(
          Effect.tap(() => Effect.logInfo("delivered claude:// link to the default Desktop")),
        ),
      ask: (decision) =>
        ask({ link: input.link, candidates: decision.candidates }).pipe(
          Effect.tap(() =>
            Effect.logInfo("asked where to deliver a claude:// link").pipe(
              Effect.annotateLogs({ candidates: decision.candidates.length }),
            ),
          ),
        ),
      reject: () => Effect.logWarning("rejected claude:// link"),
    }),
  );

const handleLink = Effect.fn("handleLink")(function* handleLink(link: string) {
  const store = yield* Store;
  const accounts = yield* store.accounts;
  const state = yield* store.state;
  const now = yield* Clock.currentTimeMillis;
  const runtimes = yield* pipe(
    accounts,
    Effect.forEach((account) => runtimeOf({ account, pendingLogins: state.pendingLogins })),
  );
  const decision = decideRoute({
    link,
    state: {
      accounts: runtimes,
      lastActiveId: Option.liftPredicate(state.lastActiveId, Str.isNonEmpty),
      now,
    },
  });
  yield* dispatch({ decision, link });
});

const takeChoice = Effect.fn("takeChoice")(function* takeChoice(link: string) {
  const session = yield* Session;
  const host = yield* Host;
  const current = yield* Ref.get(session.choices);
  const found = Option.fromNullishOr(current.get(link));
  yield* Ref.set(session.choices, new Map([...current].filter(([pending]) => pending !== link)));
  yield* host.choicesChanged;
  return found;
});

const pendingChoices = Effect.gen(function* pendingChoices() {
  const session = yield* Session;
  const current = yield* Ref.get(session.choices);
  return [...current].map(([link, candidates]) => ({ link, candidates }));
});

export { findAccount, handleLink, isRunning, pendingChoices, startDesktop, takeChoice };
