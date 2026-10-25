import type { Preset } from "@cdmm/core";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";

const selectedPresetAtom = Atom.make("default");

const useSelectedPreset = (): string => useAtomValue(selectedPresetAtom);

const useSelectPreset = (): ((id: string) => void) => useAtomSet(selectedPresetAtom);

const FIRST = 0;

const shownPreset = ({
  presets,
  selected,
}: Readonly<{ presets: readonly Preset[]; selected: string }>): Preset | undefined =>
  presets.find((each) => each.id === selected) ?? presets.at(FIRST);

export { shownPreset, useSelectedPreset, useSelectPreset };
