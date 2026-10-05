import { emptyOverride } from "@cdmm/core";
import type { Account, ApiInput } from "@cdmm/core";
import { Crypto, Effect, Ref, String as Str } from "effect";

import { identityOf } from "./identity.ts";
import { findAccount, isRunning } from "./links.ts";
import { ensure } from "./results.ts";
import { Session } from "./session.ts";
import { Store } from "./store.ts";
import { syncAccount } from "./sync.ts";

const createAccount = Effect.fn("createAccount")(function* createAccount(
  input: ApiInput<"createAccount">,
) {
  const store = yield* Store;
  const crypto = yield* Crypto.Crypto;
  const account: Account = {
    id: yield* crypto.randomUUIDv4,
    label: input.label,
    color: input.color,
    presetId: input.presetId,
    override: emptyOverride,
  };
  yield* store.saveAccount(account);
  yield* syncAccount(account);
});

const saveAccount = Effect.fn("saveAccount")(function* saveAccount(account: Account) {
  const store = yield* Store;
  yield* findAccount(account.id);
  yield* store.saveAccount(account);
  yield* syncAccount(account);
});

const deleteAccount = Effect.fn("deleteAccount")(function* deleteAccount(id: string) {
  const store = yield* Store;
  const session = yield* Session;
  yield* findAccount(id);
  yield* ensure({
    holds: !(yield* isRunning(id)),
    message: "Stop Claude Desktop for this account before deleting it",
  });
  yield* store.deleteAccount(id);
  yield* Ref.update(
    session.syncResults,
    (current) => new Map([...current].filter(([key]) => key !== id)),
  );
});

const updateSecrets = Effect.fn("updateSecrets")(function* updateSecrets(
  input: Readonly<{
    accountId: string;
    change: (current: Readonly<Record<string, string>>) => Readonly<Record<string, string>>;
  }>,
) {
  const store = yield* Store;
  const account = yield* findAccount(input.accountId);
  const current = yield* store.secrets(account.id);
  yield* store.saveSecrets({ id: account.id, value: input.change(current) });
  yield* syncAccount(account);
});

const bindIdentity = Effect.fn("bindIdentity")(function* bindIdentity(accountId: string) {
  const store = yield* Store;
  const account = yield* findAccount(accountId);
  const identity = yield* identityOf(account.id);
  yield* ensure({
    holds: Str.isNonEmpty(identity.desktopAccountUuid),
    message: "This account has not signed in to Claude Desktop yet",
  });
  yield* store.saveAccount({ ...account, boundAccountUuid: identity.desktopAccountUuid });
});

export { bindIdentity, createAccount, deleteAccount, saveAccount, updateSecrets };
