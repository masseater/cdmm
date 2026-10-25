import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { COPY } from "#/pages/picker/config/copy";
import { overviewQuery } from "#/shared/api";
import { Button } from "#/shared/ui/button";

import { ProfileList } from "./profile-list";

const PickerPage = ({ onManage }: Readonly<{ onManage: () => void }>): ReactNode => {
  const { accounts } = useSuspenseQuery(overviewQuery).data;
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <h1 className="sr-only">{COPY.heading}</h1>
      <div className="absolute top-0 right-0">
        <Button variant="ghost" size="icon" aria-label={COPY.manage} onClick={onManage}>
          {COPY.manageIcon}
        </Button>
      </div>
      <ProfileList accounts={accounts} onManage={onManage} />
    </div>
  );
};

export { PickerPage };
