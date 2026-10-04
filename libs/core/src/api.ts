import { Schema } from "effect";

import { AccountSchema, PresetSchema } from "./model.ts";
import type { Account, Preset } from "./model.ts";
import type { SecretFinding } from "./secret-guard.ts";

type DesktopInstall =
  | Readonly<{ status: "found"; version: string; testedVersion: boolean }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "unsupported-platform" }>;

type RouterStatus =
  | Readonly<{ status: "active" }>
  | Readonly<{ status: "registered" }>
  | Readonly<{ status: "unregistered" }>
  | Readonly<{ status: "unsupported-platform" }>;

type Identity = Readonly<{
  desktopAccountUuid: string;
  codeAccountUuid: string;
  codeEmail: string;
}>;

type IdentityCheck =
  | Readonly<{ status: "unbound" }>
  | Readonly<{ status: "matching" }>
  | Readonly<{ status: "mismatch"; expected: string; actual: string }>;

type SyncStatus =
  | Readonly<{ status: "synced"; skipped: readonly string[] }>
  | Readonly<{ status: "missing-secrets"; names: readonly string[] }>
  | Readonly<{ status: "failed"; message: string }>;

type AccountView = Readonly<{
  account: Account;
  running: boolean;
  waitingForLogin: boolean;
  identity: Identity;
  identityCheck: IdentityCheck;
  secretNames: readonly string[];
  sync: SyncStatus;
  paths: Readonly<{ desktop: string; code: string }>;
}>;

type Overview = Readonly<{
  desktop: DesktopInstall;
  router: RouterStatus;
  presets: readonly Preset[];
  accounts: readonly AccountView[];
}>;

type Saved =
  | Readonly<{ status: "saved" }>
  | Readonly<{ status: "rejected"; findings: readonly SecretFinding[] }>
  | Readonly<{ status: "failed"; message: string }>;

type Done = Readonly<{ status: "done" }> | Readonly<{ status: "failed"; message: string }>;

type PendingChoice = Readonly<{ link: string; candidates: readonly string[] }>;

const AccountIdInput = Schema.String;
const SecretName = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_]+$/u));

const API_INPUTS = {
  overview: Schema.Void,
  savePreset: PresetSchema,
  deletePreset: Schema.String,
  createAccount: Schema.Struct({
    label: Schema.String,
    color: Schema.String,
    presetId: Schema.String,
  }),
  saveAccount: AccountSchema,
  deleteAccount: AccountIdInput,
  setSecret: Schema.Struct({ accountId: Schema.String, name: SecretName, value: Schema.String }),
  deleteSecret: Schema.Struct({ accountId: Schema.String, name: SecretName }),
  bindIdentity: AccountIdInput,
  launchDesktop: AccountIdInput,
  signIn: AccountIdInput,
  stopDesktop: AccountIdInput,
  launchCode: AccountIdInput,
  openFolder: AccountIdInput,
  registerRouter: Schema.Void,
  pendingChoice: Schema.Void,
  choose: Schema.Struct({ link: Schema.String, accountId: Schema.String }),
  dismissChoice: Schema.String,
} satisfies Readonly<Record<keyof ApiOutputs, Schema.Top>>;

type ApiOutputs = Readonly<{
  overview: Overview;
  savePreset: Saved;
  deletePreset: Done;
  createAccount: Done;
  saveAccount: Saved;
  deleteAccount: Done;
  setSecret: Done;
  deleteSecret: Done;
  bindIdentity: Done;
  launchDesktop: Done;
  signIn: Done;
  stopDesktop: Done;
  launchCode: Done;
  openFolder: Done;
  registerRouter: Done;
  pendingChoice: readonly PendingChoice[];
  choose: Done;
  dismissChoice: Done;
}>;

type ApiMethod = keyof typeof API_INPUTS;

type ApiInput<Method extends ApiMethod> = (typeof API_INPUTS)[Method]["Type"];

type ManagerApi = Readonly<{
  [Method in ApiMethod]: (input: ApiInput<Method>) => Promise<ApiOutputs[Method]>;
}>;

export type {
  AccountView,
  ApiInput,
  ApiMethod,
  ApiOutputs,
  DesktopInstall,
  Done,
  Identity,
  IdentityCheck,
  ManagerApi,
  Overview,
  PendingChoice,
  RouterStatus,
  Saved,
  SyncStatus,
};
export { API_INPUTS };
