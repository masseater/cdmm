import type { AccountView, Preset } from "@claude-max-manager/core";
import { Option } from "effect";
import { useCallback } from "react";
import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";
import { managerApi } from "#/shared/api";
import { ActionButton } from "#/shared/ui/action-button";
import { OutcomeMessage } from "#/shared/ui/outcome-message";

import { PresetFields } from "./preset-fields";
import { usePresetDraftAtoms } from "./use-preset-draft-atoms";
import { UsedBy } from "./used-by";

const PresetEditor = ({
  preset,
  accounts,
}: Readonly<{ preset: Preset; accounts: readonly AccountView[] }>): ReactNode => {
  const form = usePresetDraftAtoms(preset);
  const { submit } = form;
  const remove = useCallback(() => managerApi().deletePreset(preset.id), [preset.id]);
  return (
    <form className="flex flex-col gap-3 md:col-span-2" onSubmit={submit}>
      <PresetFields form={form} />
      <UsedBy accounts={accounts} presetId={preset.id} />
      <OutcomeMessage outcome={Option.fromNullishOr(form.outcome)} />
      <ActionButton label={COPY.delete} actionKey="delete-preset" run={remove} variant="ghost" />
    </form>
  );
};

export { PresetEditor };
