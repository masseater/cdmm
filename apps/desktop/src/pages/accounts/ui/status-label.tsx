import type { AccountView } from "@claude-max-manager/core";
import { String as Str } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";

const identityOf = (view: AccountView): string => {
  if (view.waitingForLogin) {
    return COPY.waitingForLogin;
  }
  if (Str.isNonEmpty(view.identity.codeEmail)) {
    return view.identity.codeEmail;
  }
  if (Str.isNonEmpty(view.identity.desktopAccountUuid)) {
    return view.identity.desktopAccountUuid;
  }
  return COPY.notSignedIn;
};

const runningOf = (view: AccountView): string => {
  if (view.running) {
    return COPY.running;
  }
  return COPY.stopped;
};

const StatusLabel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <span className="flex flex-col text-left">
    <span className="text-muted-foreground text-xs">{runningOf(view)}</span>
    <span className="truncate text-xs">{identityOf(view)}</span>
  </span>
);

export { StatusLabel };
