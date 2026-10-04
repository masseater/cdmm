import { asRecord } from "@claude-max-manager/core";
import type { Account, Identity, IdentityCheck } from "@claude-max-manager/core";
import { Effect, Option, Path, Predicate, String as Str } from "effect";

import { readJson } from "./files.ts";
import { Store } from "./store.ts";

const stringAt = (value: unknown, key: string): string => {
  const found = asRecord(value)[key];
  if (Predicate.isString(found)) {
    return found;
  }
  return "";
};

const identityOf = Effect.fn("identityOf")(function* identityOf(accountId: string) {
  const store = yield* Store;
  const path = yield* Path.Path;
  const paths = yield* store.pathsOf(accountId);
  const desktop = yield* readJson(path.join(paths.desktop, "config.json"));
  const code = yield* readJson(path.join(paths.code, ".claude.json"));
  const oauth = asRecord(Option.getOrNull(code))["oauthAccount"];
  return {
    desktopAccountUuid: stringAt(Option.getOrNull(desktop), "lastKnownAccountUuid"),
    codeAccountUuid: stringAt(oauth, "accountUuid"),
    codeEmail: stringAt(oauth, "emailAddress"),
  } satisfies Identity;
});

const checkIdentity = (
  input: Readonly<{ account: Account; identity: Identity }>,
): IdentityCheck => {
  const expected = input.account.boundAccountUuid ?? "";
  if (Str.isEmpty(expected)) {
    return { status: "unbound" };
  }
  const actual = [input.identity.desktopAccountUuid, input.identity.codeAccountUuid].find(
    (uuid) => Str.isNonEmpty(uuid) && uuid !== expected,
  );
  if (Predicate.isString(actual)) {
    return { status: "mismatch", expected, actual };
  }
  return { status: "matching" };
};

const clearPendingLogin = Effect.fn("clearPendingLogin")(function* clearPendingLogin(
  accountId: string,
) {
  const store = yield* Store;
  const state = yield* store.state;
  if (!Object.hasOwn(state.pendingLogins, accountId)) {
    return;
  }
  const pendingLogins = Object.fromEntries(
    Object.entries(state.pendingLogins).filter(([id]) => id !== accountId),
  );
  yield* store.saveState({ ...state, pendingLogins });
});

const refreshBinding = Effect.fn("refreshBinding")(function* refreshBinding(
  input: Readonly<{ account: Account; identity: Identity }>,
) {
  const { account, identity } = input;
  if (Str.isEmpty(identity.desktopAccountUuid)) {
    return account;
  }
  yield* clearPendingLogin(account.id);
  if (Predicate.isString(account.boundAccountUuid)) {
    return account;
  }
  const store = yield* Store;
  const bound: Account = { ...account, boundAccountUuid: identity.desktopAccountUuid };
  yield* store.saveAccount(bound);
  return bound;
});

export { checkIdentity, identityOf, refreshBinding };
