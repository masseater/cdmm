import { Option, Predicate, String as Str } from "effect";

import type { AccountOverride, McpEntry, McpMap, Preset } from "./model.ts";

type SecretFinding = Readonly<{
  path: string;
  reason: "secret-name" | "secret-shape";
}>;

const PLACEHOLDER = /\{\{secret:[A-Za-z0-9_]+\}\}/gu;
const HAS_PLACEHOLDER = /\{\{secret:[A-Za-z0-9_]+\}\}/u;
const SECRET_NAME =
  /token|secret|passw(?:or)?d|api[-_]?key|apikey|authorization|(?:^|[-_])auth(?:$|[-_])|credential|cookie|session|private[-_]?key|bearer/iu;
const SECRET_SHAPES: readonly RegExp[] = [
  /sk-[A-Za-z0-9_-]{16,}/u,
  /gh[pousr]_[A-Za-z0-9]{20,}/u,
  /github_pat_[A-Za-z0-9_]{20,}/u,
  /xox[abpr]-[A-Za-z0-9-]{10,}/u,
  /AKIA[0-9A-Z]{16}/u,
  /AIza[0-9A-Za-z_-]{30,}/u,
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\./u,
  /bearer\s+[A-Za-z0-9._~+/=-]{8,}/iu,
  /^[A-Za-z0-9_-]{40,}$/u,
];
const FLAG = /^--?(?<name>[A-Za-z0-9_-]+)(?:=(?<value>.*))?$/u;
const NEXT_ARG = 1;

const withoutPlaceholders = (value: string): string => value.replaceAll(PLACEHOLDER, "");

const looksSecret = (value: string): boolean => {
  const rest = withoutPlaceholders(value);
  return SECRET_SHAPES.some((shape) => shape.test(rest));
};

const isLiteralSecret = (name: string, value: string): boolean =>
  SECRET_NAME.test(name) &&
  Str.isNonEmpty(withoutPlaceholders(value).trim()) &&
  !HAS_PLACEHOLDER.test(value);

const checkNamed = (
  input: Readonly<{ path: string; name: string; value: string }>,
): readonly SecretFinding[] => {
  if (isLiteralSecret(input.name, input.value)) {
    return [{ path: input.path, reason: "secret-name" }];
  }
  if (looksSecret(input.value)) {
    return [{ path: input.path, reason: "secret-shape" }];
  }
  return [];
};

const checkMap = (path: string, map: Readonly<Record<string, string>>): readonly SecretFinding[] =>
  Object.entries(map).flatMap(([name, value]) =>
    checkNamed({ path: `${path}.${name}`, name, value }),
  );

const checkArg = (
  input: Readonly<{ path: string; arg: string; next: string }>,
): readonly SecretFinding[] => {
  const groups = Option.fromNullishOr(FLAG.exec(input.arg)).pipe(
    Option.flatMapNullishOr((match) => match.groups),
    Option.getOrElse((): Readonly<Record<string, string>> => ({})),
  );
  const name = groups["name"] ?? "";
  if (SECRET_NAME.test(name)) {
    return checkNamed({ path: input.path, name, value: groups["value"] ?? input.next });
  }
  if (looksSecret(input.arg)) {
    return [{ path: input.path, reason: "secret-shape" }];
  }
  return [];
};

const checkArgs = (path: string, args: readonly string[]): readonly SecretFinding[] =>
  args.flatMap((arg, index) =>
    checkArg({
      path: `${path}[${String(index)}]`,
      arg,
      next: args.at(index + NEXT_ARG) ?? "",
    }),
  );

const checkUrl = (path: string, raw: string): readonly SecretFinding[] => {
  if (!URL.canParse(raw)) {
    return checkNamed({ path, name: "", value: raw });
  }
  const url = new URL(raw);
  const query = [...url.searchParams.entries()].flatMap(([name, value]) =>
    checkNamed({ path: `${path}?${name}`, name, value }),
  );
  if (Str.isNonEmpty(url.password)) {
    return [{ path: `${path}.password`, reason: "secret-name" }, ...query];
  }
  return query;
};

const checkEntry = (path: string, entry: McpEntry): readonly SecretFinding[] => {
  const { server } = entry;
  if (server.kind === "stdio") {
    return [...checkArgs(`${path}.args`, server.args), ...checkMap(`${path}.env`, server.env)];
  }
  return [...checkUrl(`${path}.url`, server.url), ...checkMap(`${path}.headers`, server.headers)];
};

const checkValue = (
  input: Readonly<{ path: string; name: string; value: unknown }>,
): readonly SecretFinding[] => {
  const { path, name, value } = input;
  if (Predicate.isString(value)) {
    return checkNamed({ path, name, value });
  }
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index) =>
      checkValue({ path: `${path}[${String(index)}]`, name, value: item }),
    );
  }
  if (Predicate.isObject(value)) {
    return Object.entries(value).flatMap(([key, item]) =>
      checkValue({ path: `${path}.${key}`, name: key, value: item }),
    );
  }
  return [];
};

const checkMcp = (mcp: McpMap): readonly SecretFinding[] =>
  Object.entries(mcp).flatMap(([name, entry]) => checkEntry(`mcp.${name}`, entry));

const checkSources = (
  source: Readonly<{ mcp: McpMap; codeSettings: unknown; rules: string }>,
): readonly SecretFinding[] => [
  ...checkMcp(source.mcp),
  ...checkValue({ path: "codeSettings", name: "", value: source.codeSettings }),
  ...checkNamed({ path: "rules", name: "", value: source.rules }),
];

const findSecretsInPreset = (preset: Preset): readonly SecretFinding[] => checkSources(preset);

const findSecretsInOverride = (override: AccountOverride): readonly SecretFinding[] =>
  checkSources(override);

export type { SecretFinding };
export { findSecretsInOverride, findSecretsInPreset };
