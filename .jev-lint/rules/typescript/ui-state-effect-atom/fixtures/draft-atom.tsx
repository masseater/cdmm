import { useAtom } from "@effect/atom-react";
import { Option } from "effect";
import { Atom } from "effect/reactivity";

const draftFamily = Atom.family((key: string) => Atom.make(Option.none<string>()));

export const useDraftAtom = (key: string, saved: string) => {
  const [draft, setDraft] = useAtom(draftFamily(key));
  return {
    value: Option.getOrElse(draft, () => saved),
    change: (next: string) => setDraft(Option.some(next)),
  };
};
