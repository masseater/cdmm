import type { AccountView, Preset } from "@cdmm/core";
import { useAtomValue } from "@effect/atom-react";
import type { ReactNode } from "react";

import { selectedPresetAtom, shownPreset } from "#/pages/global/model/selection";

import { NewPresetForm } from "./new-preset-form";
import { PresetRow } from "./preset-row";

const PresetList = ({
  presets,
  accounts,
}: Readonly<{ presets: readonly Preset[]; accounts: readonly AccountView[] }>): ReactNode => {
  const shown = shownPreset({ presets, selected: useAtomValue(selectedPresetAtom) });
  return (
    <aside className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1">
        {presets.map((preset) => (
          <PresetRow
            key={preset.id}
            preset={preset}
            accounts={accounts}
            pressed={preset === shown}
          />
        ))}
      </ul>
      <NewPresetForm />
    </aside>
  );
};

export { PresetList };
