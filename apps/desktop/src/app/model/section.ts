import { Atom } from "effect/reactivity";

type Section = "picker" | "accounts" | "global";

const sectionAtom = Atom.make<Section>("picker");

export type { Section };
export { sectionAtom };
