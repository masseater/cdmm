import type { AccountView } from "@claude-max-manager/core";
import { Array as Arr } from "effect";
import type { ReactNode } from "react";

import { COPY } from "#/pages/picker/config/copy";
import { Button } from "#/shared/ui/button";

import { ProfileButton } from "./profile-button";

const ProfileList = ({
  accounts,
  onManage,
}: Readonly<{ accounts: readonly AccountView[]; onManage: () => void }>): ReactNode => {
  if (Arr.isReadonlyArrayEmpty(accounts)) {
    return <Button onClick={onManage}>{COPY.add}</Button>;
  }
  return (
    <ul className="flex flex-wrap justify-center gap-6">
      {accounts.map((view, index) => (
        <ProfileButton key={view.account.id} view={view} index={index} />
      ))}
    </ul>
  );
};

export { ProfileList };
