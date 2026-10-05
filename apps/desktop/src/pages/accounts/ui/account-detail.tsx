import type { AccountView } from "@cdmm/core";
import type { ReactNode } from "react";

import { AccountHeading } from "./account-heading";
import { ActionBar } from "./action-bar";
import { IdentityWarning } from "./identity-warning";
import { SettingsPanel } from "./settings-panel";
import { SyncNote } from "./sync-note";

const AccountDetail = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <section className="flex flex-col gap-5 md:col-span-2">
    <AccountHeading view={view} />
    <ActionBar view={view} />
    <IdentityWarning view={view} />
    <SyncNote sync={view.sync} />
    <SettingsPanel view={view} />
  </section>
);

export { AccountDetail };
