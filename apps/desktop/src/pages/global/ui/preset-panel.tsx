import type { Preset } from "@claude-max-manager/core";
import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import type { ReactNode } from "react";

import { selectedPresetAtom } from "#/pages/global/model/selection";

import { PresetEditor } from "./preset-editor";

const FIRST = 0;

const PresetPanel = ({ presets }: Readonly<{ presets: readonly Preset[] }>): ReactNode => {
  const selected = useAtomValue(selectedPresetAtom);
  const preset = Option.fromNullishOr(
    presets.find((each) => each.id === selected) ?? presets.at(FIRST),
  );
  return Option.match(preset, {
    onNone: () => "",
    onSome: (found) => <PresetEditor key={found.id} preset={found} />,
  });
};

export { PresetPanel };
