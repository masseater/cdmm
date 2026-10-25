import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { overviewQuery } from "#/shared/api";

import { AccountList } from "./account-list";
import { AccountPanel } from "./account-panel";

const AccountsPage = (): ReactNode => {
  const { data } = useSuspenseQuery(overviewQuery);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <AccountList accounts={data.accounts} />
      <AccountPanel accounts={data.accounts} />
    </div>
  );
};

export { AccountsPage };
