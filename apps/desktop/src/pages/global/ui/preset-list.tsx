import type { Preset } from "@claude-max-manager/core";
import type { ReactNode } from "react";

import { COPY } from "#/pages/global/config/copy";

import { NewPresetForm } from "./new-preset-form";
import { PresetRow } from "./preset-row";

const PresetList = ({ presets }: Readonly<{ presets: readonly Preset[] }>): ReactNode => (
  <aside className="flex flex-col gap-3">
    <p className="text-muted-foreground text-xs">{COPY.intro}</p>
    <ul className="flex flex-col gap-1">
      {presets.map((preset) => (
        <PresetRow key={preset.id} preset={preset} />
      ))}
    </ul>
    <NewPresetForm />
  </aside>
);

export { PresetList };
