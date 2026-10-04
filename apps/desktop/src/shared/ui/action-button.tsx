import type { Done } from "@claude-max-manager/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { useAction } from "#/shared/api";

import { Button } from "./button";
import { OutcomeMessage } from "./outcome-message";

type Variant = "default" | "outline" | "destructive" | "secondary" | "ghost";

const ActionButton = ({
  label,
  actionKey,
  run,
  variant = "outline",
}: Readonly<{
  label: string;
  actionKey: string;
  run: () => Promise<Done>;
  variant?: Variant;
}>): ReactNode => {
  const action = useAction({ key: actionKey, run });
  const { mutate } = action;
  const click = useCallback(() => {
    mutate();
  }, [mutate]);
  return (
    <span className="inline-flex flex-col gap-1">
      <Button size="sm" variant={variant} disabled={action.isPending} onClick={click}>
        {label}
      </Button>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </span>
  );
};

export type { Variant };
export { ActionButton };
