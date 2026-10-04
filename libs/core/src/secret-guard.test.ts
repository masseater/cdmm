import { describe, expect, it } from "vite-plus/test";

import { http, override, preset, stdio } from "./fixtures.test.helpers.ts";
import type { McpMap } from "./model.ts";
import { findSecretsInOverride, findSecretsInPreset } from "./secret-guard.ts";

const pathsFor = (mcp: McpMap): readonly string[] =>
  findSecretsInPreset(preset({ mcp, codeSettings: {}, rules: "" })).map(({ path }) => path);

const LITERALS: McpMap = {
  env: stdio({ command: "node", env: { GITHUB_TOKEN: "abc123" } }),
  joined: stdio({ command: "node", args: ["--api-key=abc123"] }),
  split: stdio({ command: "node", args: ["--token", "abc123"] }),
  header: http({
    url: "https://example.com/mcp",
    headers: { Authorization: "Bearer abcdefghijkl" },
  }),
  query: http({ url: "https://example.com/mcp?access_token=abc123" }),
  userinfo: http({ url: "https://user:pass@example.com/mcp" }),
  shaped: stdio({ command: "node", env: { ANY: "ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaa" } }),
};

const REFERENCES: McpMap = {
  env: stdio({
    command: "node",
    env: { GITHUB_TOKEN: "{{secret:GITHUB}}", PORT: "3000", OAUTH_CALLBACK_PORT: "8080" },
  }),
  args: stdio({
    command: "node",
    args: ["--token", "{{secret:X}}", String.raw`C:\Users\me\repo`],
  }),
  header: http({
    url: "https://example.com/mcp",
    headers: { Authorization: "Bearer {{secret:X}}" },
  }),
};

const SETTINGS_WITH_TOKEN = preset({
  mcp: {},
  codeSettings: { env: { ANTHROPIC_AUTH_TOKEN: "abc" } },
});

const COMPANY = stdio({ command: "node", env: { API_KEY: "k" } });

describe("the secret guard on presets", () => {
  it("accepts a preset that only references secrets", () => {
    expect(findSecretsInPreset(preset())).toStrictEqual([]);
  });

  it("rejects literal secrets in env, args, headers, and URLs", () => {
    expect(pathsFor(LITERALS)).toStrictEqual([
      "mcp.env.env.GITHUB_TOKEN",
      "mcp.joined.args[0]",
      "mcp.split.args[0]",
      "mcp.header.headers.Authorization",
      "mcp.query.url?access_token",
      "mcp.userinfo.url.password",
      "mcp.shaped.env.ANY",
    ]);
  });

  it("allows placeholders and ordinary values", () => {
    expect(pathsFor(REFERENCES)).toStrictEqual([]);
  });

  it("rejects secrets hidden in Claude Code settings", () => {
    expect(findSecretsInPreset(SETTINGS_WITH_TOKEN)).toStrictEqual([
      { path: "codeSettings.env.ANTHROPIC_AUTH_TOKEN", reason: "secret-name" },
    ]);
  });
});

describe("the secret guard on overrides", () => {
  it("applies the same rule", () => {
    expect(findSecretsInOverride(override({ mcp: { company: COMPANY } }))).toStrictEqual([
      { path: "mcp.company.env.API_KEY", reason: "secret-name" },
    ]);
  });
});
