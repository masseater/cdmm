import type { AccountView } from "@claude-max-manager/core";
import { String as Str } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

import { IdentityRows } from "./identity-rows";

const checkText = (view: AccountView): string => {
  if (view.identityCheck.status === "mismatch") {
    return COPY.mismatch(view.identityCheck.expected, view.identityCheck.actual);
  }
  if (view.identityCheck.status === "matching") {
    return COPY.matching;
  }
  return COPY.unbound;
};

const canBind = (view: AccountView): boolean =>
  view.identityCheck.status !== "matching" && Str.isNonEmpty(view.identity.desktopAccountUuid);

const IdentityCard = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const bind = useCallback(() => managerApi().bindIdentity(id), [id]);
  return (
    <section className="flex flex-col gap-2 rounded-md border p-4">
      <h2 className="font-semibold">{COPY.identity}</h2>
      <IdentityRows view={view} />
      <p className="text-sm">{checkText(view)}</p>
      {canBind(view) && <ActionButton label={COPY.bind} actionKey="bind-identity" run={bind} />}
    </section>
  );
};

export { IdentityCard };
