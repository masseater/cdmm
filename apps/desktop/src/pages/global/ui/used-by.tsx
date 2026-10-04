import type { AccountView } from "@claude-max-manager/core";
import { Array as Arr } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";

const textOf = (users: readonly AccountView[]): string => {
  if (Arr.isReadonlyArrayNonEmpty(users)) {
    return COPY.usedBy(users.map((view) => view.account.label).join(", "));
  }
  return COPY.unused;
};

const UsedBy = ({
  accounts,
  presetId,
}: Readonly<{ accounts: readonly AccountView[]; presetId: string }>): ReactNode => (
  <p className="text-muted-foreground text-sm">
    {textOf(accounts.filter((view) => view.account.presetId === presetId))}
  </p>
);

export { UsedBy };
