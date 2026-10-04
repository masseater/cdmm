import type { AccountView } from "@claude-max-manager/core";
import { useAtom } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { selectedAccountAtom } from "#/pages/accounts/model/selection";
import { Button } from "#/shared/ui/button";

import { StatusLabel } from "./status-label";

const variantOf = (selected: boolean): "secondary" | "ghost" => {
  if (selected) {
    return "secondary";
  }
  return "ghost";
};

const AccountRow = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const [selected, setSelected] = useAtom(selectedAccountAtom);
  const select = useCallback(() => {
    setSelected(view.account.id);
  }, [setSelected, view.account.id]);
  return (
    <li className="flex items-center gap-2">
      <Button size="lg" variant={variantOf(selected === view.account.id)} onClick={select}>
        {view.account.label}
        <StatusLabel view={view} />
      </Button>
    </li>
  );
};

export { AccountRow };
