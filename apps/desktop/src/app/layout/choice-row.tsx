import type { AccountView, PendingChoice } from "@cdmm/core";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { Button } from "#/shared/ui/button";

import { ChoiceButton } from "./choice-button";

const ChoiceRow = ({
  choice,
  accounts,
}: Readonly<{ choice: PendingChoice; accounts: readonly AccountView[] }>): ReactNode => {
  const { mutate } = useAction({
    key: "dismiss-choice",
    run: (link: string) => managerApi().dismissChoice(link),
  });
  const dismiss = useCallback(() => {
    mutate(choice.link);
  }, [choice.link, mutate]);
  return (
    <div className="border-ring bg-accent mt-4 flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
      <span className="font-medium">{COPY.choiceQuestion}</span>
      <code className="text-muted-foreground truncate text-xs">{choice.link}</code>
      {accounts.map((view) => (
        <ChoiceButton key={view.account.id} link={choice.link} account={view.account} />
      ))}
      <Button size="sm" variant="ghost" onClick={dismiss}>
        {COPY.ignore}
      </Button>
    </div>
  );
};

export { ChoiceRow };
