import type { AccountView } from "@cdmm/core";
import { useAtomValue } from "@effect/atom-react";
import type { ReactNode } from "react";

import { selectedAccountAtom, shownAccount } from "#/pages/accounts/model/selection";

import { AccountRow } from "./account-row";
import { NewAccountForm } from "./new-account-form";

const AccountList = ({ accounts }: Readonly<{ accounts: readonly AccountView[] }>): ReactNode => {
  const shown = shownAccount({ accounts, selected: useAtomValue(selectedAccountAtom) });
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
