import type { AccountView, Done } from "@claude-max-manager/core";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { isSignedIn } from "#/pages/accounts/model/identity";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

type Primary = Readonly<{ label: string; key: string; run: (id: string) => Promise<Done> }>;

const primaryOf = (view: AccountView): Primary => {
  if (view.running) {
    return { label: COPY.stop, key: "stop-desktop", run: (id) => managerApi().stopDesktop(id) };
  }
  if (isSignedIn(view)) {
    return {
      label: COPY.start,
      key: "launch-desktop",
      run: (id) => managerApi().launchDesktop(id),
    };
  }
  return { label: COPY.signIn, key: "sign-in", run: (id) => managerApi().signIn(id) };
};

const ActionBar = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const primary = primaryOf(view);
  const { run } = primary;
  const runPrimary = useCallback(() => run(id), [id, run]);
  const code = useCallback(() => managerApi().launchCode(id), [id]);
  return (
    <div className="flex flex-wrap items-start gap-2">
      <ActionButton
        label={primary.label}
        actionKey={primary.key}
        run={runPrimary}
        variant="default"
      />
      <ActionButton label={COPY.launchCode} actionKey="launch-code" run={code} />
    </div>
  );
};

export { ActionBar };
