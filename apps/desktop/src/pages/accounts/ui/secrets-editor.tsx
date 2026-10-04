import type { AccountView } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

import { SecretForm } from "./secret-form";
import { SecretRow } from "./secret-row";

const SecretsEditor = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <section className="flex flex-col gap-2 rounded-md border p-4">
    <h2 className="font-semibold">{COPY.secrets}</h2>
    <ul className="flex flex-col gap-1">
      {view.secretNames.map((name) => (
        <SecretRow key={name} accountId={view.account.id} name={name} />
      ))}
    </ul>
    <SecretForm accountId={view.account.id} />
  </section>
);

export { SecretsEditor };
