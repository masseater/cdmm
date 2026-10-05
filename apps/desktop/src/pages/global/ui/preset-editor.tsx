import type { Preset } from "@cdmm/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";
import { Button } from "#/shared/ui/button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { PresetFields } from "./preset-fields";
import { usePresetDraftAtoms } from "./use-preset-draft-atoms";

const PresetEditor = ({ preset }: Readonly<{ preset: Preset }>): ReactNode => {
  const form = usePresetDraftAtoms(preset);
  const { submit } = form;
  const remove = useCallback(() => managerApi().deletePreset(preset.id), [preset.id]);
  return (
    <form className="flex flex-col gap-3 md:col-span-2" onSubmit={submit}>
      <PresetFields form={form} />
      <OutcomeMessage outcome={Option.fromNullishOr(form.outcome)} />
      <div className="flex items-start gap-2">
        <Button type="submit" size="sm">
          {COPY.save}
        </Button>
        <ActionButton label={COPY.delete} actionKey="delete-preset" run={remove} variant="ghost" />
      </div>
    </form>
  );
};

export { PresetEditor };
