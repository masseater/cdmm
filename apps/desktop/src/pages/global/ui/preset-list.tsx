import type { AccountView, Preset } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { NewPresetForm } from "./new-preset-form";
import { PresetRow } from "./preset-row";

const PresetList = ({
  presets,
  accounts,
}: Readonly<{ presets: readonly Preset[]; accounts: readonly AccountView[] }>): ReactNode => (
  <aside className="flex flex-col gap-3">
    <ul className="flex flex-col gap-1">
      {presets.map((preset) => (
        <PresetRow key={preset.id} preset={preset} accounts={accounts} />
      ))}
    </ul>
    <NewPresetForm />
  </aside>
);

export { PresetList };
