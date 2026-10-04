import type { RouterStatus as RouterState } from "@claude-max-manager/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/app/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

const RouterStatus = ({ router }: Readonly<{ router: RouterState }>): ReactNode => {
  const action = useAction({ key: "register-router", run: () => managerApi().registerRouter() });
  const { mutate } = action;
  const register = useCallback(() => {
    mutate();
  }, [mutate]);
  if (router.status === "active" || router.status === "unsupported-platform") {
    return "";
  }
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={register}>
        {COPY.routerSetup}
      </Button>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </div>
  );
};

export { RouterStatus };
