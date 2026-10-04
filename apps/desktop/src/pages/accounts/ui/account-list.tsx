import type { AccountView } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { AccountRow } from "./account-row";
import { NewAccountForm } from "./new-account-form";

const AccountList = ({ accounts }: Readonly<{ accounts: readonly AccountView[] }>): ReactNode => (
  <aside className="flex flex-col gap-3">
    <ul className="flex flex-col gap-1">
      {accounts.map((view) => (
        <AccountRow key={view.account.id} view={view} />
      ))}
    </ul>
    <NewAccountForm />
  </aside>
);

export { AccountList };
