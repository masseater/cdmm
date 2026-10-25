import type { Preset } from "@cdmm/core";
import { Option } from "effect";
import type { ReactNode } from "react";

import { shownPreset, useSelectedPreset } from "#/pages/global/model/selection";

import { PresetEditor } from "./preset-editor";

const PresetPanel = ({ presets }: Readonly<{ presets: readonly Preset[] }>): ReactNode => {
  const selected = useSelectedPreset();
  const preset = Option.fromNullishOr(shownPreset({ presets, selected }));
  return Option.match(preset, {
    onNone: () => "",
    onSome: (found) => <PresetEditor key={found.id} preset={found} />,
  });
};

export { PresetPanel };
