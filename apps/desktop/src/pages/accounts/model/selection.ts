import { Atom } from "effect/reactivity";

const selectedAccountAtom = Atom.make("");

const armedDeleteAtom = Atom.make("");

export { armedDeleteAtom, selectedAccountAtom };
