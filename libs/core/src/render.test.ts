import { Option } from "effect";
import { describe, expect, it } from "vite-plus/test";

import {
  contextFor,
  GITHUB,
  noFiles,
  override,
  preset,
  renderOk,
  serverNames,
  serverOf,
  stdio,
} from "./fixtures.test.helpers.ts";
import { emptyManaged, emptyOverride } from "./model.ts";
import { render } from "./render.ts";
import { asRecord, resolveEffective } from "./resolve.ts";

const PERSONAL_TOKEN = "ghp_personalAAAAAAAAAAAAAAAAAAAA";
const WORK_TOKEN = "ghp_workBBBBBBBBBBBBBBBBBBBBBBBB";
const SECRETS = { GITHUB: PERSONAL_TOKEN };
const DEFAULT = Option.some(preset());
const GITHUB_ONLY = Option.some(preset({ mcp: { github: GITHUB } }));
const FS = stdio({ command: "fs" });
const MINIMAL = Option.some(preset({ id: "minimal", mcp: { fs: FS }, codeSettings: {} }));

const personal = renderOk({
  context: contextFor({ account: "personal", secrets: { GITHUB: PERSONAL_TOKEN } }),
});
const work = renderOk({
  context: contextFor({ account: "work", secrets: { GITHUB: WORK_TOKEN } }),
});

describe("credential isolation", () => {
  it("never writes one account's secret into another account's files", () => {
    expect(JSON.stringify(personal)).toContain(PERSONAL_TOKEN);
    expect(JSON.stringify(personal)).not.toContain(WORK_TOKEN);
    expect(JSON.stringify(work)).toContain(WORK_TOKEN);
    expect(JSON.stringify(work)).not.toContain(PERSONAL_TOKEN);
  });

  it("points local MCP servers at the account's own home and token store", () => {
    expect(JSON.stringify(personal)).toContain(String.raw`C:\\cmm\\personal\\mcp-home\\.mcp-auth`);
    expect(JSON.stringify(personal)).not.toContain(String.raw`\\work\\`);
    expect(JSON.stringify(work)).not.toContain(String.raw`\\personal\\`);
  });

  it("keeps secrets off the command line of remote MCP bridges", () => {
    const bridge = serverOf({ file: personal.desktopConfig, name: "github" });
    expect(bridge["args"]).toContain(`Authorization:\${MCP_HEADER_0}`);
    expect(JSON.stringify(bridge["args"])).not.toContain("ghp_");
    expect(asRecord(bridge["env"])["MCP_HEADER_0"]).toBe(`Bearer ${PERSONAL_TOKEN}`);
  });

  it("refuses to render while a referenced secret is missing", () => {
    const result = render({
      effective: resolveEffective({ preset: DEFAULT, override: emptyOverride }),
      current: noFiles,
      managed: emptyManaged,
      context: contextFor({ account: "personal", secrets: {} }),
    });
    expect(result).toStrictEqual({ status: "missing-secrets", names: ["GITHUB"] });
  });
});

describe("override", () => {
  it("adds an account-only server next to the global ones", () => {
    const rendered = renderOk({
      override: override({ mcp: { "company-mcp": stdio({ command: "company" }) } }),
      context: contextFor({ account: "work", secrets: SECRETS }),
    });
    expect(serverNames(rendered.desktopConfig)).toStrictEqual([
      "company-mcp",
      "github",
      "notion",
      "sentry",
    ]);
  });

  it("disables one inherited server for one account", () => {
    const rendered = renderOk({
      override: override({ disabledMcp: ["notion"] }),
      context: contextFor({ account: "side", secrets: SECRETS }),
    });
    expect(serverNames(rendered.codeConfig)).toStrictEqual(["github", "sentry"]);
  });

  it("wins per setting while keeping the rest of the preset", () => {
    const rendered = renderOk({
      override: override({ codeSettings: { model: "sonnet", permissions: { deny: ["Bash"] } } }),
      context: contextFor({ account: "work", secrets: SECRETS }),
    });
    expect(rendered.codeSettings).toStrictEqual({
      model: "sonnet",
      permissions: { allow: ["Read"], deny: ["Bash"] },
    });
  });
});

const before = renderOk({ context: contextFor({ account: "work", secrets: SECRETS }) });

describe("global changes", () => {
  it("remove a deleted global server but keep servers the user added in the app", () => {
    const edited = {
      ...before.desktopConfig,
      mcpServers: {
        ...asRecord(before.desktopConfig["mcpServers"]),
        "my-local": { command: "local" },
      },
      preferences: { theme: "dark" },
    };
    const after = renderOk({
      preset: GITHUB_ONLY,
      context: contextFor({ account: "work", secrets: SECRETS }),
      current: { ...noFiles, desktopConfig: edited },
      managed: before.managed,
    });
    expect(serverNames(after.desktopConfig)).toStrictEqual(["github", "my-local"]);
    expect(after.desktopConfig["preferences"]).toStrictEqual({ theme: "dark" });
  });

  it("drop every server and setting of the old preset when the account switches presets", () => {
    const after = renderOk({
      preset: MINIMAL,
      context: contextFor({ account: "work", secrets: SECRETS }),
      current: { ...before, codeSettings: { ...before.codeSettings, theme: "light" } },
      managed: before.managed,
    });
    expect(serverNames(after.desktopConfig)).toStrictEqual(["fs"]);
    expect(after.codeSettings).toStrictEqual({ theme: "light" });
  });
});

describe("deleting a preset", () => {
  it("keeps account-specific servers", () => {
    const company = override({ mcp: { "company-mcp": stdio({ command: "company" }) } });
    const withCompany = renderOk({
      override: company,
      context: contextFor({ account: "work", secrets: SECRETS }),
    });
    const after = renderOk({
      preset: Option.none(),
      override: company,
      context: contextFor({ account: "work", secrets: SECRETS }),
      current: withCompany,
      managed: withCompany.managed,
    });
    expect(serverNames(after.desktopConfig)).toStrictEqual(["company-mcp"]);
  });
});

describe("rules", () => {
  const context = contextFor({ account: "work", secrets: SECRETS });

  it("rewrite only their own block in CLAUDE.md", () => {
    const rendered = renderOk({ context, current: { ...noFiles, rules: "My notes\n" } });
    expect(rendered.rules).toBe(
      "<!-- claude-max-manager:begin -->\nAnswer in Japanese.\n<!-- claude-max-manager:end -->\n\nMy notes\n",
    );
  });

  it("leave only the user's text once the preset has no rules", () => {
    const first = renderOk({ context, current: { ...noFiles, rules: "My notes\n" } });
    const cleared = renderOk({
      preset: Option.some(preset({ rules: "" })),
      context,
      current: { ...noFiles, rules: first.rules },
    });
    expect(cleared.rules).toBe("My notes\n");
  });
});
