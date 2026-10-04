import { emptyOverride } from "@claude-max-manager/core";
import type { Account, McpEntry, Preset } from "@claude-max-manager/core";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { runTest } from "./harness.test-helpers.ts";
import { handlers } from "./manager.ts";
import {
  accountFile,
  accountJson,
  addHandWrittenServer,
  createAccount,
  GITHUB,
  treeText,
  WORK,
} from "./scenario.test-helpers.ts";
import { Store } from "./store.ts";

const TOKEN_A = "token-for-account-a-0123456789";
const TOKEN_B = "token-for-account-b-9876543210";
const TOKEN_BODY_LENGTH = 36;
const FAKE_TOKEN = ["ghp", "_", "x".repeat(TOKEN_BODY_LENGTH)].join("");

const LINEAR: McpEntry = {
  server: { kind: "http", url: "https://mcp.linear.app/mcp", headers: {} },
  targets: "both",
  shareHome: false,
};

const LOCAL: McpEntry = {
  server: { kind: "stdio", command: "local-mcp", args: [], env: {} },
  targets: "desktop",
  shareHome: false,
};

const LEAKED: Preset = {
  ...WORK,
  mcp: {
    github: {
      ...GITHUB,
      server: {
        kind: "http",
        url: "https://x.invalid",
        headers: { Authorization: `Bearer ${FAKE_TOKEN}` },
      },
    },
  },
};

const twoWorkAccounts = Effect.gen(function* twoWorkAccounts() {
  yield* handlers.savePreset(WORK);
  const first = yield* createAccount({ label: "A", presetId: "work" });
  const second = yield* createAccount({ label: "B", presetId: "work" });
  yield* handlers.setSecret({ accountId: first.id, name: "GITHUB", value: TOKEN_A });
  yield* handlers.setSecret({ accountId: second.id, name: "GITHUB", value: TOKEN_B });
  return { first, second };
});

const accountTree = Effect.fn("accountTree")(function* accountTree(account: Account) {
  const store = yield* Store;
  const paths = yield* store.pathsOf(account.id);
  return yield* treeText(paths.root);
});

const desktopConfigOf = Effect.fn("desktopConfigOf")(function* desktopConfigOf(account: Account) {
  return yield* accountJson({ account, parts: ["desktop", "claude_desktop_config.json"] });
});

const codeSettingsOf = Effect.fn("codeSettingsOf")(function* codeSettingsOf(account: Account) {
  return yield* accountJson({ account, parts: ["claude-code", "settings.json"] });
});

describe("credentials never cross accounts", () => {
  it("renders each account's token only into its own files", () =>
    runTest(
      Effect.gen(function* credentials() {
        const { first, second } = yield* twoWorkAccounts;
        const firstTree = yield* accountTree(first);
        const secondTree = yield* accountTree(second);
        expect(firstTree).toContain(TOKEN_A);
        expect(firstTree).not.toContain(TOKEN_B);
        expect(secondTree).toContain(TOKEN_B);
        expect(secondTree).not.toContain(TOKEN_A);
      }),
    ));

  it("keeps tokens out of Global and out of the sealed secrets file", () =>
    runTest(
      Effect.gen(function* globalStaysClean() {
        const { first } = yield* twoWorkAccounts;
        const store = yield* Store;
        const globalTree = yield* treeText(store.roots.presets);
        const sealed = yield* accountFile({ account: first, parts: ["secrets.bin"] });
        expect(globalTree).toContain("{{secret:GITHUB}}");
        expect(`${globalTree}${sealed}`).not.toContain(TOKEN_A);
      }),
    ));
});

describe("the secret guard", () => {
  it("refuses a preset that carries a literal token and keeps the old one", () =>
    runTest(
      Effect.gen(function* rejectsLiteral() {
        yield* handlers.savePreset(WORK);
        const saved = yield* handlers.savePreset(LEAKED);
        const store = yield* Store;
        const globalTree = yield* treeText(store.roots.presets);
        expect(saved.status).toBe("rejected");
        expect(globalTree).not.toContain(FAKE_TOKEN);
      }),
    ));
});

describe("Global and Override scope", () => {
  it("applies a Global MCP change only to accounts using that preset", () =>
    runTest(
      Effect.gen(function* globalScope() {
        const { first } = yield* twoWorkAccounts;
        const other = yield* createAccount({ label: "C", presetId: "default" });
        yield* handlers.savePreset({ ...WORK, mcp: { ...WORK.mcp, linear: LINEAR } });
        expect(yield* desktopConfigOf(first)).toHaveProperty(["mcpServers", "linear"]);
        expect(yield* desktopConfigOf(other)).not.toHaveProperty(["mcpServers", "linear"]);
      }),
    ));

  it("lets an Override win over Global for that account only", () =>
    runTest(
      Effect.gen(function* overrideWins() {
        const { first, second } = yield* twoWorkAccounts;
        const override = {
          ...emptyOverride,
          codeSettings: { model: "sonnet" },
          disabledMcp: ["github"],
        };
        yield* handlers.saveAccount({ ...first, override });
        expect(yield* codeSettingsOf(first)).toHaveProperty("model", "sonnet");
        expect(yield* codeSettingsOf(second)).toHaveProperty("model", "opus");
        expect(yield* desktopConfigOf(first)).not.toHaveProperty(["mcpServers", "github"]);
        expect(yield* desktopConfigOf(second)).toHaveProperty(["mcpServers", "github"]);
      }),
    ));
});

describe("deleting and switching Global presets", () => {
  it("keeps Override and hand-added servers when the Global preset is deleted", () =>
    runTest(
      Effect.gen(function* deletion() {
        const { first } = yield* twoWorkAccounts;
        const override = { ...emptyOverride, mcp: { local: LOCAL } };
        yield* handlers.saveAccount({ ...first, override });
        yield* addHandWrittenServer(first);
        const result = yield* handlers.deletePreset("work");
        const config = yield* desktopConfigOf(first);
        expect(result.status).toBe("done");
        expect(config).not.toHaveProperty(["mcpServers", "github"]);
        expect(config).toHaveProperty(["mcpServers", "local"]);
        expect(config).toHaveProperty(["mcpServers", "mine"]);
      }),
    ));

  it("switches presets without losing the Override", () =>
    runTest(
      Effect.gen(function* presetSwitch() {
        const { first } = yield* twoWorkAccounts;
        const withOverride = { ...first, override: { ...emptyOverride, mcp: { local: LOCAL } } };
        yield* handlers.saveAccount(withOverride);
        yield* handlers.saveAccount({ ...withOverride, presetId: "default" });
        const config = yield* desktopConfigOf(first);
        expect(config).not.toHaveProperty(["mcpServers", "github"]);
        expect(config).toHaveProperty(["mcpServers", "local"]);
      }),
    ));
});
