import { AccountOverrideSchema } from "@cdmm/core";
import type { AccountView, Saved } from "@cdmm/core";
import { Option, Result, Schema } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom } from "#/shared/lib/draft-atom";
import { formatJson } from "#/shared/lib/json";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { OverrideField } from "./override-field";

const parseOverride = Schema.decodeUnknownResult(Schema.fromJsonString(AccountOverrideSchema));

const OverrideEditor = ({ view }: Readonly<{ view: AccountView }>): ReactNode => {
  const { account } = view;
  const draft = useDraftAtom({
    key: `account:${account.id}:override`,
    saved: formatJson(account.override),
  });
  const run = useCallback(
    (text: string): Promise<Saved> =>
      Result.match(parseOverride(text), {
        onFailure: (issue) => Promise.resolve<Saved>({ status: "failed", message: issue.message }),
        onSuccess: (override) => managerApi().saveAccount({ ...account, override }),
      }),
    [account],
  );
  const action = useAction({ key: "save-override", run });
  const { mutate } = action;
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      mutate(draft.value, {
        onSuccess: (outcome) => {
          if (outcome.status === "saved") {
            draft.reset();
          }
        },
      });
    },
    [draft, mutate],
  );
  return (
    <form className="mt-6 flex flex-col gap-2" onSubmit={submit}>
      <OverrideField draft={draft} />
      <div>
        <Button type="submit" size="sm">
          {COPY.save}
        </Button>
      </div>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </form>
  );
};

export { OverrideEditor };
