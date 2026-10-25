import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

const SecretRow = ({
  accountId,
  name,
}: Readonly<{ accountId: string; name: string }>): ReactNode => {
  const remove = useCallback(
    () => managerApi().deleteSecret({ accountId, name }),
    [accountId, name],
  );
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <code>{name}</code>
      <ActionButton label={COPY.remove} actionKey="delete-secret" run={remove} variant="ghost" />
    </li>
  );
};

export { SecretRow };
