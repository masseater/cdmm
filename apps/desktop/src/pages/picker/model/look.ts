import { Array as Arr, Option, String as Str } from "effect";

const TONES = [
  "bg-profile-1",
  "bg-profile-2",
  "bg-profile-3",
  "bg-profile-4",
  "bg-profile-5",
  "bg-profile-6",
] as const;

const WORD_BREAK = /[\s_-]+/u;
const FIRST = 0;

const toneOf = (index: number): string =>
  Option.getOrElse(Arr.get(TONES, index % TONES.length), () => TONES[FIRST]);

const initialOf = (word: Option.Option<string>): string =>
  Option.match(word, { onNone: () => "", onSome: (found) => found.charAt(FIRST) });

const initialsOf = (label: string): string => {
  const words = label.split(WORD_BREAK).filter((word) => Str.isNonEmpty(word));
  const first = initialOf(Arr.head(words));
  const last = initialOf(Arr.tail(words).pipe(Option.flatMap(Arr.last)));
  return `${first}${last}`.toUpperCase();
};

export { initialsOf, toneOf };
