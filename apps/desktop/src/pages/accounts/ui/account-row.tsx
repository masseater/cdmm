import type { AccountView } from "@cdmm/core";
import { useAtomSet } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { StatusLabel } from "#/entities/account";
import { selectedAccountAtom } from "#/pages/accounts/model/selection";
import { ListRow } from "#/shared/ui/list-row";

const AccountRow = ({
  view,
  pressed,
}: Readonly<{ view: AccountView; pressed: boolean }>): ReactNode => {
  const setSelected = useAtomSet(selectedAccountAtom);
  const select = useCallback(() => {
    setSelected(view.account.id);
  }, [setSelected, view.account.id]);
  return (
    <ListRow title={view.account.label} pressed={pressed} onSelect={select}>
      <StatusLabel view={view} />
    </ListRow>
  );
};

export { AccountRow };
