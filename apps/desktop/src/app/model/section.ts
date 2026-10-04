import { Atom } from "effect/reactivity";

type Section = "accounts" | "global";

const sectionAtom = Atom.make<Section>("accounts");

export type { Section };
export { sectionAtom };
