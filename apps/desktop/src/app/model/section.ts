import { Atom } from "effect/reactivity";

type Section = "picker" | "accounts" | "global";

const sectionAtom = Atom.make<Section>("picker");

const windowModeOf = (section: Section): "picker" | "manage" => {
  if (section === "picker") {
    return "picker";
  }
  return "manage";
};

const APP_TITLE = "Claude Max Desktop Manager";
const PAGE_TITLES: Readonly<Record<Section, string>> = {
  picker: APP_TITLE,
  accounts: `Profiles | ${APP_TITLE}`,
  global: `Global | ${APP_TITLE}`,
};

const titleOf = (section: Section): string => PAGE_TITLES[section];

export type { Section };
export { sectionAtom, titleOf, windowModeOf };
