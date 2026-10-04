import type { AccountView } from "@claude-max-manager/core";
import { String as Str } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

const orUnknown = (value: string): string => {
  if (Str.isNonEmpty(value)) {
    return value;
  }
  return COPY.unknown;
};

const IdentityRows = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <dl className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
    <dt className="text-muted-foreground">{COPY.desktopAccount}</dt>
    <dd className="col-span-2 font-mono text-xs">{orUnknown(view.identity.desktopAccountUuid)}</dd>
    <dt className="text-muted-foreground">{COPY.codeAccount}</dt>
    <dd className="col-span-2 font-mono text-xs">{orUnknown(view.identity.codeEmail)}</dd>
    <dt className="text-muted-foreground">{COPY.paths}</dt>
    <dd className="col-span-2 font-mono text-xs break-all">{view.paths.desktop}</dd>
  </dl>
);

export { IdentityRows };
