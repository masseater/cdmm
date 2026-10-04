import type { AccountView } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { StatusLabel } from "./status-label";

const AccountHeading = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <div className="flex flex-col gap-1">
    <h2 className="text-xl font-semibold">{view.account.label}</h2>
    <StatusLabel view={view} />
  </div>
);

export { AccountHeading };
