import { useAtomSet } from "@effect/atom-react";
import { String as Str } from "effect";
import { useCallback } from "react";
import type { ReactNode, SubmitEventHandler } from "react";

import { COPY } from "#/pages/global/config/copy";
import { selectedPresetAtom } from "#/pages/global/model/selection";
import { managerApi, useAction } from "#/shared/api";
import { useDraftAtom, useDraftAtomChange } from "#/shared/lib/draft-atom";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { LabeledField } from "#/shared/ui/labeled-field";

const NOT_ID = /[^a-z0-9]+/gu;
const EDGE_DASH = /^-+|-+$/gu;

const idOf = (name: string): string =>
  name.toLowerCase().replaceAll(NOT_ID, "-").replaceAll(EDGE_DASH, "");

const NewPresetForm = (): ReactNode => {
  const name = useDraftAtom({ key: "new-preset:name", saved: "" });
  const select = useAtomSet(selectedPresetAtom);
  const typeName = useDraftAtomChange(name);
  const { mutate } = useAction({ key: "create-preset", run: managerApi().savePreset });
  const submit: SubmitEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const id = idOf(name.value);
      if (Str.isNonEmpty(id)) {
        const preset = { id, name: name.value.trim(), mcp: {}, codeSettings: {}, rules: "" };
        mutate(preset, {
          onSuccess: () => {
            name.reset();
            select(id);
          },
        });
      }
    },
    [mutate, name, select],
  );
  return (
    <form className="flex items-end gap-2" onSubmit={submit}>
      <LabeledField label={COPY.newPreset}>
        {(id) => <Input id={id} name="name" required value={name.value} onChange={typeName} />}
      </LabeledField>
      <Button type="submit" variant="outline">
        {COPY.create}
      </Button>
    </form>
  );
};

export { NewPresetForm };
