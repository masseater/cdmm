import type { AccountView } from "@cdmm/core";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

const IdentityWarning = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const bind = useCallback(() => managerApi().bindIdentity(id), [id]);
  if (view.identityCheck.status !== "mismatch") {
    return "";
  }
  return (
    <div role="alert" className="text-destructive flex flex-col items-start gap-2 text-sm">
      {COPY.mismatch(view.identityCheck.expected, view.identityCheck.actual)}
      <ActionButton label={COPY.bind} actionKey="bind-identity" run={bind} />
    </div>
  );
};

export { IdentityWarning };
