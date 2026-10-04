import type { AccountView } from "@claude-max-manager/core";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";

import { DeleteButton } from "./delete-button";

const ActionBar = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { id } = view.account;
  const launch = useCallback(() => managerApi().launchDesktop(id), [id]);
  const signIn = useCallback(() => managerApi().signIn(id), [id]);
  const stop = useCallback(() => managerApi().stopDesktop(id), [id]);
  const code = useCallback(() => managerApi().launchCode(id), [id]);
  const folder = useCallback(() => managerApi().openFolder(id), [id]);
  return (
    <div className="flex flex-wrap items-start gap-2">
      <ActionButton
        label={COPY.launchDesktop}
        actionKey="launch-desktop"
        run={launch}
        variant="default"
      />
      <ActionButton label={COPY.signIn} actionKey="sign-in" run={signIn} />
      <ActionButton label={COPY.stop} actionKey="stop-desktop" run={stop} />
      <ActionButton label={COPY.launchCode} actionKey="launch-code" run={code} />
      <ActionButton label={COPY.openFolder} actionKey="open-folder" run={folder} variant="ghost" />
      <DeleteButton accountId={id} />
    </div>
  );
};

export { ActionBar };
