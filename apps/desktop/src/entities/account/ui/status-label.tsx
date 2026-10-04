import type { AccountView } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { COPY } from "#/entities/account/config/copy";
import { isSignedIn, whoOf } from "#/entities/account/model/identity";

const runningOf = (view: AccountView): string => {
  if (view.running) {
    return COPY.running;
  }
  return COPY.stopped;
};

const signInOf = (view: AccountView): string => {
  if (view.waitingForLogin) {
    return COPY.signingIn;
  }
  if (isSignedIn(view)) {
    return whoOf(view);
  }
  return COPY.notSignedIn;
};

const StatusLabel = ({ view }: Readonly<{ view: AccountView }>): ReactNode => (
  <span className="text-muted-foreground truncate text-xs">
    {`${runningOf(view)} · ${signInOf(view)}`}
  </span>
);

export { StatusLabel };
