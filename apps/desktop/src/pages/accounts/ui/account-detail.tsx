import type { AccountView } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { ActionBar } from "./action-bar";
import { IdentityCard } from "./identity-card";
import { OverrideEditor } from "./override-editor";
import { SecretsEditor } from "./secrets-editor";
import { SettingsForm } from "./settings-form";
import { SyncNote } from "./sync-note";

const AccountDetail = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <section className="flex flex-col gap-6 md:col-span-2">
    <ActionBar view={view} />
    <SyncNote sync={view.sync} />
    <IdentityCard view={view} />
    <SettingsForm view={view} />
    <OverrideEditor view={view} />
    <SecretsEditor view={view} />
  </section>
);

export { AccountDetail };
