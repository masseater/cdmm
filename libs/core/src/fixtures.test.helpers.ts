import { Option } from "effect";

import type { AccountOverride, Managed, McpEntry, Preset } from "./model.ts";
import { emptyManaged, emptyOverride } from "./model.ts";
import type { CurrentFiles, Rendered, RenderContext } from "./render.ts";
import { render } from "./render.ts";
import { asRecord, resolveEffective } from "./resolve.ts";

type StringMap = Readonly<Record<string, string>>;

const stdio = (
  spec: Readonly<{ command: string; args?: readonly string[]; env?: StringMap }>,
): McpEntry => ({
  server: { kind: "stdio", command: spec.command, args: spec.args ?? [], env: spec.env ?? {} },
  targets: "both",
  shareHome: false,
});

const http = (spec: Readonly<{ url: string; headers?: StringMap }>): McpEntry => ({
  server: { kind: "http", url: spec.url, headers: spec.headers ?? {} },
  targets: "both",
  shareHome: false,
});

const GITHUB = http({
  url: "https://api.githubcopilot.com/mcp/",
  headers: { Authorization: "Bearer {{secret:GITHUB}}" },
});

const preset = (patch: Partial<Preset> = {}): Preset => ({
  id: "default",
  name: "Default",
  mcp: {
    github: GITHUB,
    notion: http({ url: "https://mcp.notion.com/mcp" }),
    sentry: stdio({ command: "npx" }),
  },
  codeSettings: { model: "opus", permissions: { allow: ["Read"] } },
  rules: "Answer in Japanese.",
  ...patch,
});

const override = (patch: Partial<AccountOverride> = {}): AccountOverride => ({
  ...emptyOverride,
  ...patch,
});

const contextFor = (spec: Readonly<{ account: string; secrets: StringMap }>): RenderContext => {
  const home = `C:\\cmm\\${spec.account}\\mcp-home`;
  return {
    secrets: spec.secrets,
    home: {
      home,
      appData: `${home}\\AppData\\Roaming`,
      localAppData: `${home}\\AppData\\Local`,
      mcpAuth: `${home}\\.mcp-auth`,
    },
  };
};

const noFiles: CurrentFiles = { desktopConfig: {}, codeConfig: {}, codeSettings: {}, rules: "" };

type RenderSpec = Readonly<{
  preset?: Option.Option<Preset>;
  override?: AccountOverride;
  context: RenderContext;
  current?: CurrentFiles;
  managed?: Managed;
}>;

const DEFAULT_PRESET = Option.some(preset());

const renderOk = (spec: RenderSpec): Rendered => {
  const effective = resolveEffective({
    preset: spec.preset ?? DEFAULT_PRESET,
    override: spec.override ?? emptyOverride,
  });
  const result = render({
    effective,
    current: spec.current ?? noFiles,
    managed: spec.managed ?? emptyManaged,
    context: spec.context,
  });
  if (result.status === "missing-secrets") {
    throw new Error(`missing secrets: ${result.names.join(",")}`);
  }
  return result.value;
};

const serverNames = (file: Readonly<Record<string, unknown>>): readonly string[] =>
  Object.keys(asRecord(file["mcpServers"])).toSorted();

const serverOf = (
  spec: Readonly<{ file: Readonly<Record<string, unknown>>; name: string }>,
): Readonly<Record<string, unknown>> => asRecord(asRecord(spec.file["mcpServers"])[spec.name]);

export type { RenderSpec, StringMap };
export {
  contextFor,
  GITHUB,
  http,
  noFiles,
  override,
  preset,
  renderOk,
  serverNames,
  serverOf,
  stdio,
};
