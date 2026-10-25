import type { Account } from "@cdmm/core";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { managerApi, useAction } from "#/shared/api";
import { Button } from "#/shared/ui/button";

const ChoiceButton = ({
  link,
  account,
}: Readonly<{ link: string; account: Account }>): ReactNode => {
  const { mutate } = useAction({
    key: "choose",
    run: (accountId: string) => managerApi().choose({ link, accountId }),
  });
  const choose = useCallback(() => {
    mutate(account.id);
  }, [account.id, mutate]);
  return (
    <Button size="sm" variant="outline" onClick={choose}>
      {account.label}
    </Button>
  );
};

export { ChoiceButton };
