import type { Preset } from "@cdmm/core";
import { Atom } from "effect/reactivity";

const selectedPresetAtom = Atom.make("default");

const FIRST = 0;

const shownPreset = ({
  presets,
  selected,
}: Readonly<{ presets: readonly Preset[]; selected: string }>): Preset | undefined =>
  presets.find((each) => each.id === selected) ?? presets.at(FIRST);

export { selectedPresetAtom, shownPreset };
