import { Array as Arr, String as Str } from "effect";

import type { Managed, McpEntry, McpMap, McpServer, Settings } from "./model.ts";
import type { Effective } from "./resolve.ts";
import { isPlainRecord } from "./resolve.ts";

type IsolatedHome = Readonly<{
  home: string;
  appData: string;
  localAppData: string;
  mcpAuth: string;
}>;

type Secrets = Readonly<Record<string, string>>;

type RenderContext = Readonly<{
  secrets: Secrets;
  home: IsolatedHome;
}>;

type CurrentFiles = Readonly<{
  desktopConfig: Settings;
  codeConfig: Settings;
  codeSettings: Settings;
  rules: string;
}>;

type Rendered = CurrentFiles & Readonly<{ managed: Managed }>;

type RenderResult =
  | Readonly<{ status: "rendered"; value: Rendered }>
  | Readonly<{ status: "missing-secrets"; names: readonly string[] }>;

type RenderInput = Readonly<{
  effective: Effective;
  current: CurrentFiles;
  managed: Managed;
  context: RenderContext;
}>;

type Target = "desktop" | "code";

const PLACEHOLDER = /\{\{secret:(?<name>[A-Za-z0-9_]+)\}\}/gu;
const RULES_BEGIN = "<!-- claude-max-manager:begin -->";
const RULES_END = "<!-- claude-max-manager:end -->";
const NOT_FOUND = -1;
const START = 0;

const placeholdersIn = (value: string): readonly string[] =>
  [...value.matchAll(PLACEHOLDER)].flatMap((match) => Object.values(match.groups ?? {}));

const stringsIn = (server: McpServer): readonly string[] => {
  if (server.kind === "stdio") {
    return [server.command, ...server.args, ...Object.values(server.env)];
  }
  return [server.url, ...Object.values(server.headers)];
};

const missingSecrets = (mcp: McpMap, secrets: Secrets): readonly string[] => [
  ...new Set(
    Object.values(mcp)
      .flatMap((entry) => stringsIn(entry.server))
      .flatMap((value) => placeholdersIn(value))
      .filter((name) => !Object.hasOwn(secrets, name)),
  ),
];

const fill = (value: string, secrets: Secrets): string =>
  value.replaceAll(PLACEHOLDER, (_match, name: string) => secrets[name] ?? "");

const fillMap = (map: Readonly<Record<string, string>>, secrets: Secrets): Settings =>
  Object.fromEntries(Object.entries(map).map(([key, value]) => [key, fill(value, secrets)]));

const isolationEnv = (entry: McpEntry, home: IsolatedHome): Settings => {
  if (entry.shareHome) {
    return {};
  }
  return {
    USERPROFILE: home.home,
    HOME: home.home,
    APPDATA: home.appData,
    LOCALAPPDATA: home.localAppData,
    MCP_REMOTE_CONFIG_DIR: home.mcpAuth,
  };
};

const headerVariable = (index: number): string => `MCP_HEADER_${String(index)}`;

const remoteBridge = (entry: McpEntry, context: RenderContext): Settings => {
  if (entry.server.kind !== "http") {
    return {};
  }
  const headers = Object.entries(fillMap(entry.server.headers, context.secrets));
  return {
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      fill(entry.server.url, context.secrets),
      ...headers.flatMap(([name], index) => ["--header", `${name}:\${${headerVariable(index)}}`]),
    ],
    env: {
      ...Object.fromEntries(headers.map(([, value], index) => [headerVariable(index), value])),
      ...isolationEnv(entry, context.home),
    },
  };
};

const stdioServer = (entry: McpEntry, context: RenderContext): Settings => {
  if (entry.server.kind !== "stdio") {
    return {};
  }
  return {
    command: fill(entry.server.command, context.secrets),
    args: entry.server.args.map((arg) => fill(arg, context.secrets)),
    env: { ...fillMap(entry.server.env, context.secrets), ...isolationEnv(entry, context.home) },
  };
};

const desktopServer = (entry: McpEntry, context: RenderContext): Settings => {
  if (entry.server.kind === "stdio") {
    return stdioServer(entry, context);
  }
  return remoteBridge(entry, context);
};

const codeServer = (entry: McpEntry, context: RenderContext): Settings => {
  if (entry.server.kind === "stdio") {
    return { type: "stdio", ...stdioServer(entry, context) };
  }
  return {
    type: "http",
    url: fill(entry.server.url, context.secrets),
    headers: fillMap(entry.server.headers, context.secrets),
  };
};

const SERVER_RENDERERS: Readonly<
  Record<Target, (entry: McpEntry, context: RenderContext) => Settings>
> = { desktop: desktopServer, code: codeServer };

const replaceManaged = (
  current: Settings,
  next: Readonly<{ values: Settings; previouslyManaged: readonly string[] }>,
): Settings => ({
  ...Object.fromEntries(
    Object.entries(current).filter(([key]) => !next.previouslyManaged.includes(key)),
  ),
  ...next.values,
});

const withMcpServers = (
  file: Settings,
  next: Readonly<{ values: Settings; previouslyManaged: readonly string[] }>,
): Settings => {
  const servers = file["mcpServers"];
  if (isPlainRecord(servers)) {
    return { ...file, mcpServers: replaceManaged(servers, next) };
  }
  return { ...file, mcpServers: next.values };
};

const outsideBlock = (current: string): string => {
  const begin = current.indexOf(RULES_BEGIN);
  const end = current.indexOf(RULES_END);
  if (begin === NOT_FOUND || end < begin) {
    return current.trim();
  }
  return `${current.slice(START, begin)}${current.slice(end + RULES_END.length)}`.trim();
};

const rulesBlock = (rules: string): string => {
  if (Str.isNonEmpty(rules)) {
    return `${RULES_BEGIN}\n${rules}\n${RULES_END}`;
  }
  return "";
};

const withRules = (current: string, rules: string): string => {
  const parts = [rulesBlock(rules), outsideBlock(current)].filter((part) => Str.isNonEmpty(part));
  if (Arr.isReadonlyArrayNonEmpty(parts)) {
    return `${parts.join("\n\n")}\n`;
  }
  return "";
};

const serversFor = (
  input: Readonly<{ effective: Effective; target: Target; context: RenderContext }>,
): Settings =>
  Object.fromEntries(
    Object.entries(input.effective.mcp)
      .filter(([, entry]) => entry.targets === "both" || entry.targets === input.target)
      .map(([name, entry]) => [name, SERVER_RENDERERS[input.target](entry, input.context)]),
  );

const render = (input: RenderInput): RenderResult => {
  const { effective, current, managed, context } = input;
  const missing = missingSecrets(effective.mcp, context.secrets);
  if (Arr.isReadonlyArrayNonEmpty(missing)) {
    return { status: "missing-secrets", names: missing };
  }
  const desktop = serversFor({ effective, target: "desktop", context });
  const code = serversFor({ effective, target: "code", context });
  return {
    status: "rendered",
    value: {
      desktopConfig: withMcpServers(current.desktopConfig, {
        values: desktop,
        previouslyManaged: managed.desktopMcp,
      }),
      codeConfig: withMcpServers(current.codeConfig, {
        values: code,
        previouslyManaged: managed.codeMcp,
      }),
      codeSettings: replaceManaged(current.codeSettings, {
        values: effective.codeSettings,
        previouslyManaged: managed.codeSettings,
      }),
      rules: withRules(current.rules, effective.rules),
      managed: {
        desktopMcp: Object.keys(desktop),
        codeMcp: Object.keys(code),
        codeSettings: Object.keys(effective.codeSettings),
      },
    },
  };
};

export type { CurrentFiles, IsolatedHome, RenderContext, Rendered, RenderResult };
export { render };
