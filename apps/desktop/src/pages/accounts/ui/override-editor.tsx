import { AccountOverrideSchema } from "@claude-max-manager/core";
import type { AccountView, Saved } from "@claude-max-manager/core";
import { Option, Result, Schema } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { formatJson } from "#/shared/lib/json";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";
import { Textarea } from "#/shared/ui/textarea";

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
  const edit = useDraftAtomChange(draft);
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
      <h3 className="text-sm font-medium">{COPY.override}</h3>
      <p className="text-muted-foreground text-xs">{COPY.overrideHelp}</p>
      <Textarea aria-label={COPY.override} rows={8} value={draft.value} onChange={edit} />
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
