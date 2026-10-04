import { findSecretsInOverride, findSecretsInPreset } from "@claude-max-manager/core";
import type { ApiInput, ApiMethod, ApiOutputs } from "@claude-max-manager/core";
import { Effect, Option } from "effect";

import {
  bindIdentity,
  createAccount,
  deleteAccount,
  saveAccount,
  updateSecrets,
} from "./accounts.ts";
import {
  launchCode,
  launchDesktop,
  openFolder,
  registerRouter,
  signIn,
  stopDesktop,
} from "./launch.ts";
import { findAccount, pendingChoices, startDesktop, takeChoice } from "./links.ts";
import { ensure, saveChecked, settle } from "./results.ts";
import type { ManagerServices } from "./services.ts";
import { Store } from "./store.ts";
import { syncPreset } from "./sync.ts";
import { overview } from "./views.ts";

type Handlers = Readonly<{
  [Method in ApiMethod]: (
    input: ApiInput<Method>,
  ) => Effect.Effect<ApiOutputs[Method], never, ManagerServices>;
}>;

const savePreset = Effect.fn("savePreset")(function* savePreset(preset: ApiInput<"savePreset">) {
  const store = yield* Store;
  yield* store.savePreset(preset);
  yield* syncPreset(preset.id);
});

const deletePreset = Effect.fn("deletePreset")(function* deletePreset(id: string) {
  const store = yield* Store;
  yield* store.deletePreset(id);
  yield* syncPreset(id);
});

const choose = Effect.fn("choose")(function* choose(input: ApiInput<"choose">) {
  const account = yield* findAccount(input.accountId);
  const pending = yield* takeChoice(input.link);
  yield* ensure({ holds: Option.isSome(pending), message: "This link is no longer waiting" });
  yield* startDesktop({ account, link: Option.some(input.link) });
});

const without =
  (name: string) =>
  (current: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
    Object.fromEntries(Object.entries(current).filter(([key]) => key !== name));

const handlers: Handlers = {
  overview: () => overview.pipe(Effect.orDie),
  savePreset: (preset) =>
    saveChecked({ findings: findSecretsInPreset(preset), action: savePreset(preset) }),
  deletePreset: (id) => settle(deletePreset(id)),
  createAccount: (input) => settle(createAccount(input)),
  saveAccount: (account) =>
    saveChecked({
      findings: findSecretsInOverride(account.override),
      action: saveAccount(account),
    }),
  deleteAccount: (id) => settle(deleteAccount(id)),
  setSecret: (input) =>
    settle(
      updateSecrets({
        accountId: input.accountId,
        change: (current) => ({ ...current, [input.name]: input.value }),
      }),
    ),
  deleteSecret: (input) =>
    settle(updateSecrets({ accountId: input.accountId, change: without(input.name) })),
  bindIdentity: (id) => settle(bindIdentity(id)),
  launchDesktop: (id) => settle(launchDesktop(id)),
  signIn: (id) => settle(signIn(id)),
  stopDesktop: (id) => settle(stopDesktop(id)),
  launchCode: (id) => settle(launchCode(id)),
  openFolder: (id) => settle(openFolder(id)),
  registerRouter: () => settle(registerRouter),
  pendingChoice: () => pendingChoices,
  choose: (input) => settle(choose(input)),
  dismissChoice: (link) => settle(takeChoice(link)),
};

export type { Handlers };
export { handlers };
