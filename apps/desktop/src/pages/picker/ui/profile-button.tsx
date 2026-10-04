import type { AccountView, Done } from "@claude-max-manager/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { isSignedIn } from "#/entities/account";
import { managerApi, useAction } from "#/shared/api";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { ProfileIcon } from "./profile-icon";

const openOf = (view: AccountView): ((id: string) => Promise<Done>) => {
  if (view.running || isSignedIn(view)) {
    return (id) => managerApi().launchDesktop(id);
  }
  return (id) => managerApi().signIn(id);
};

const ProfileButton = ({
  view,
  index,
}: Readonly<{ view: AccountView; index: number }>): ReactNode => {
  const { account } = view;
  const action = useAction({ key: "open-profile", run: openOf(view) });
  const { mutate } = action;
  const open = useCallback(() => {
    mutate(account.id);
  }, [mutate, account.id]);
  return (
    <li className="flex w-36 flex-col items-center gap-1">
      <button
        type="button"
        disabled={action.isPending}
        className="hover:bg-muted flex w-full flex-col items-center gap-2 rounded-xl p-3 disabled:opacity-50"
        onClick={open}
      >
        <ProfileIcon label={account.label} index={index} running={view.running} />
        <span className="w-full truncate text-center text-base">{account.label}</span>
      </button>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </li>
  );
};

export { ProfileButton };
