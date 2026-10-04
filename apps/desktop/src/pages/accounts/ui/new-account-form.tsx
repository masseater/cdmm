import { String as Str } from "effect";
import { useCallback } from "react";
import type { SubmitEventHandler, ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";

const DEFAULT_COLOR = "#d97757";
const DEFAULT_PRESET = "default";

const NewAccountForm = (): ReactNode => {
  const label = useDraftAtom({ key: "new-account:label", saved: "" });
  const { mutate } = useAction({
    key: "create-account",
    run: (name: string) =>
      managerApi().createAccount({ label: name, color: DEFAULT_COLOR, presetId: DEFAULT_PRESET }),
  });
  const typeLabel = useDraftAtomChange(label);
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const name = label.value.trim();
      if (Str.isNonEmpty(name)) {
        mutate(name, { onSuccess: label.reset });
      }
    },
    [label, mutate],
  );
  return (
    <form className="flex gap-2" onSubmit={submit}>
      <Input
        aria-label={COPY.newAccount}
        placeholder={COPY.newAccount}
        value={label.value}
        onChange={typeLabel}
      />
      <Button type="submit" variant="outline">
        {COPY.add}
      </Button>
    </form>
  );
};

export { NewAccountForm };
