import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { COPY } from "#/pages/picker/config/copy";
import { overviewQuery } from "#/shared/api";
import { Button } from "#/shared/ui/button";

import { ProfileList } from "./profile-list";

const PickerPage = ({ onManage }: Readonly<{ onManage: () => void }>): ReactNode => {
  const { accounts } = useSuspenseQuery(overviewQuery).data;
  return (
    <div className="flex flex-col gap-16">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.manage}
          title={COPY.manage}
          onClick={onManage}
        >
          {COPY.manageIcon}
        </Button>
      </div>
      <div className="flex justify-center">
        <ProfileList accounts={accounts} onManage={onManage} />
      </div>
    </div>
  );
};

export { PickerPage };
