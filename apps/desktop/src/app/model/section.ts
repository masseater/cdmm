import { Atom } from "effect/reactivity";

type Section = "picker" | "accounts" | "global";

const sectionAtom = Atom.make<Section>("picker");

const windowModeOf = (section: Section): "picker" | "manage" => {
  if (section === "picker") {
    return "picker";
  }
  return "manage";
};

export type { Section };
export { sectionAtom, windowModeOf };
