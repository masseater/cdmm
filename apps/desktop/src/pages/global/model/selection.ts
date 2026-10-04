import { Atom } from "effect/reactivity";

const selectedPresetAtom = Atom.make("default");

export { selectedPresetAtom };
