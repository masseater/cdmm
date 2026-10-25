import { useAtom } from "@effect/atom-react";
import { Option } from "effect";
import { Atom } from "effect/reactivity";
import { useCallback } from "react";
import type { ChangeEventHandler } from "react";

type DraftAtom = Readonly<{
  value: string;
  dirty: boolean;
  change: (next: string) => void;
  reset: () => void;
}>;

const draftFamily = Atom.family((key: string) =>
  Atom.make(Option.none<string>()).pipe(Atom.withLabel(key)),
);

const useDraftAtom = (input: Readonly<{ key: string; saved: string }>): DraftAtom => {
  const [draft, setDraft] = useAtom(draftFamily(input.key));
  const change = useCallback(
    (next: string) => {
      setDraft(Option.some(next));
    },
    [setDraft],
  );
  const reset = useCallback(() => {
    setDraft(Option.none());
  }, [setDraft]);
  return {
    value: Option.getOrElse(draft, () => input.saved),
    dirty: Option.isSome(draft),
    change,
    reset,
  };
};

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const useDraftAtomChange = (draft: DraftAtom): ChangeEventHandler<Field> =>
  useCallback(
    (event) => {
      draft.change(event.target.value);
    },
    [draft],
  );

export type { DraftAtom, Field };
export { useDraftAtom, useDraftAtomChange };
