import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { SecretFields } from "./secret-fields";

const SecretForm = ({ accountId }: Readonly<{ accountId: string }>): ReactNode => {
  const name = useDraftAtom({ key: `account:${accountId}:secret-name`, saved: "" });
  const value = useDraftAtom({ key: `account:${accountId}:secret-value`, saved: "" });
  const action = useAction({ key: "set-secret", run: managerApi().setSecret });
  const { mutate } = action;
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      mutate(
        { accountId, name: name.value, value: value.value },
        {
          onSuccess: () => {
            name.reset();
            value.reset();
          },
        },
      );
    },
    [accountId, mutate, name, value],
  );
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
      <SecretFields name={name} value={value} />
      <Button type="submit" size="sm">
        {COPY.addSecret}
      </Button>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </form>
  );
};

export { SecretForm };
