import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

const SecretForm = ({ accountId }: Readonly<{ accountId: string }>): ReactNode => {
  const name = useDraftAtom({ key: `account:${accountId}:secret-name`, saved: "" });
  const value = useDraftAtom({ key: `account:${accountId}:secret-value`, saved: "" });
  const action = useAction({ key: "set-secret", run: managerApi().setSecret });
  const { mutate } = action;
  const typeName = useDraftAtomChange(name);
  const typeValue = useDraftAtomChange(value);
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
    <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
      <Input
        aria-label={COPY.secretName}
        placeholder="GITHUB_TOKEN"
        value={name.value}
        onChange={typeName}
      />
      <Input
        aria-label={COPY.secretValue}
        type="password"
        autoComplete="off"
        value={value.value}
        onChange={typeValue}
      />
      <Button type="submit" size="sm">
        {COPY.addSecret}
      </Button>
      <OutcomeMessage outcome={Option.fromNullishOr(action.data)} />
    </form>
  );
};

export { SecretForm };
