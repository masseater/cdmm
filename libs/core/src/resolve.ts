import { Option, Predicate, String as Str } from "effect";

import type { AccountOverride, McpMap, Preset, Settings } from "./model.ts";

type Effective = Readonly<{
  mcp: McpMap;
  codeSettings: Settings;
  rules: string;
}>;

const isPlainRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  Predicate.isObject(value) && !Array.isArray(value);

const asRecord = (value: unknown): Readonly<Record<string, unknown>> => {
  if (isPlainRecord(value)) {
    return value;
  }
  return {};
};

const mergeValue = (base: unknown, patch: unknown): unknown => {
  if (isPlainRecord(base) && isPlainRecord(patch)) {
    return Object.fromEntries([
      ...Object.entries(base).filter(([key]) => !Object.hasOwn(patch, key)),
      ...Object.entries(patch).map(([key, value]) => [key, mergeValue(base[key], value)]),
    ]);
  }
  return patch;
};

const resolveEffective = (
  input: Readonly<{ preset: Option.Option<Preset>; override: AccountOverride }>,
): Effective => {
  const { override } = input;
  const presetMcp = input.preset.pipe(
    Option.map((preset): McpMap => preset.mcp),
    Option.getOrElse((): McpMap => ({})),
  );
  const presetSettings = input.preset.pipe(
    Option.map((preset): Settings => preset.codeSettings),
    Option.getOrElse((): Settings => ({})),
  );
  const presetRules = input.preset.pipe(
    Option.map((preset) => preset.rules),
    Option.getOrElse(() => ""),
  );
  const inherited = Object.entries(presetMcp).filter(
    ([name]) => !override.disabledMcp.includes(name),
  );
  const merged = mergeValue(presetSettings, override.codeSettings);
  return {
    mcp: Object.fromEntries([...inherited, ...Object.entries(override.mcp)]),
    codeSettings: Object.fromEntries(Object.entries(asRecord(merged))),
    rules: [presetRules, override.rules]
      .map((part) => part.trim())
      .filter((part) => Str.isNonEmpty(part))
      .join("\n\n"),
  };
};

export type { Effective };
export { asRecord, isPlainRecord, resolveEffective };
