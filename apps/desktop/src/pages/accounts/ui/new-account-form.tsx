import { String as Str } from "effect";
import { useCallback } from "react";
import type { SubmitEventHandler, ReactNode } from "react";

import { COPY } from "#/pages/accounts/config/copy";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";

import { PresetSelect } from "./preset-select";

const DEFAULT_COLOR = "#d97757";

const NewAccountForm = (): ReactNode => {
  const label = useDraftAtom({ key: "new-account:label", saved: "" });
  const preset = useDraftAtom({ key: "new-account:preset", saved: "default" });
  const { mutate } = useAction({
    key: "create-account",
    run: (input: Readonly<{ label: string; presetId: string }>) =>
      managerApi().createAccount({ ...input, color: DEFAULT_COLOR }),
  });
  const typeLabel = useDraftAtomChange(label);
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (Str.isNonEmpty(label.value.trim())) {
        mutate({ label: label.value.trim(), presetId: preset.value }, { onSuccess: label.reset });
      }
    },
    [label, mutate, preset.value],
  );
  return (
    <form className="flex flex-col gap-2 rounded-md border p-3" onSubmit={submit}>
      <Input
        aria-label={COPY.label}
        placeholder={COPY.newAccount}
        value={label.value}
        onChange={typeLabel}
      />
      <PresetSelect draft={preset} />
      <Button type="submit" size="sm">
        {COPY.create}
      </Button>
    </form>
  );
};

export { NewAccountForm };
