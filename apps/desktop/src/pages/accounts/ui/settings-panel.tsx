import type { AccountView } from "@cdmm/core";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

import { DangerZone } from "./danger-zone";
import { OverrideEditor } from "./override-editor";
import { SecretsEditor } from "./secrets-editor";
import { SettingsForm } from "./settings-form";

const SettingsPanel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <details className="flex flex-col gap-6 border-t pt-4">
    <summary className="focus-visible:ring-ring/50 w-fit cursor-pointer rounded-sm text-sm font-medium outline-none focus-visible:ring-3">
      {COPY.settings}
    </summary>
    <SettingsForm view={view} />
    <OverrideEditor view={view} />
    <SecretsEditor view={view} />
    <DangerZone accountId={view.account.id} />
  </details>
);

export { SettingsPanel };
