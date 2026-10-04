import { useAtom } from "@effect/atom-react";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { armedDeleteAtom } from "#/pages/accounts/model/selection";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";
import { Button } from "#/shared/ui/button";

const DeleteButton = ({ accountId }: Readonly<{ accountId: string }>): ReactNode => {
  const [armed, setArmed] = useAtom(armedDeleteAtom);
  const arm = useCallback(() => {
    setArmed(accountId);
  }, [accountId, setArmed]);
  const remove = useCallback(() => managerApi().deleteAccount(accountId), [accountId]);
  if (armed === accountId) {
    return (
      <ActionButton
        label={COPY.confirmDelete}
        actionKey="delete-account"
        run={remove}
        variant="destructive"
      />
    );
  }
  return (
    <Button size="sm" variant="ghost" onClick={arm}>
      {COPY.delete}
    </Button>
  );
};

export { DeleteButton };
