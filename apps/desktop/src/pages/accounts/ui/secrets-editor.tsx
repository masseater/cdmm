import type { AccountView } from "@cdmm/core";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

import { SecretForm } from "./secret-form";
import { SecretRow } from "./secret-row";

const SecretsEditor = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <section className="mt-6 flex flex-col gap-2">
    <h3 className="text-sm font-medium">{COPY.secrets}</h3>
    <ul className="flex flex-col gap-1">
      {view.secretNames.map((name) => (
        <SecretRow key={name} accountId={view.account.id} name={name} />
      ))}
    </ul>
    <SecretForm accountId={view.account.id} />
  </section>
);

export { SecretsEditor };
