import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

import { DeleteButton } from "./delete-button";

const DangerZone = ({ accountId }: Readonly<{ accountId: string }>): ReactNode => {
  const folder = useCallback(() => managerApi().openFolder(accountId), [accountId]);
  return (
    <div className="mt-4 flex gap-2">
      <ActionButton label={COPY.openFolder} actionKey="open-folder" run={folder} variant="ghost" />
      <DeleteButton accountId={accountId} />
    </div>
  );
};

export { DangerZone };
