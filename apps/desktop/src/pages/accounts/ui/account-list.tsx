import type { AccountView } from "@cdmm/core";
import type { ReactNode } from "react";

import { shownAccount, useSelectedAccount } from "#/pages/accounts/model/selection";

import { AccountRow } from "./account-row";
import { NewAccountForm } from "./new-account-form";

const AccountList = ({ accounts }: Readonly<{ accounts: readonly AccountView[] }>): ReactNode => {
  const shown = shownAccount({ accounts, selected: useSelectedAccount() });
  return (
    <aside className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1">
        {accounts.map((view) => (
          <AccountRow key={view.account.id} view={view} pressed={view === shown} />
        ))}
      </ul>
      <NewAccountForm />
    </aside>
  );
};

export { AccountList };
