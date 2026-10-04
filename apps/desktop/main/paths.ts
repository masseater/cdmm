import type { IsolatedHome } from "@claude-max-manager/core";

type Join = (...segments: readonly string[]) => string;

type AccountPaths = Readonly<{
  root: string;
  account: string;
  secrets: string;
  managed: string;
  desktop: string;
  code: string;
  home: IsolatedHome;
}>;

type RootPaths = Readonly<{
  root: string;
  presets: string;
  accounts: string;
  state: string;
}>;

const ROOT_NAME = "ClaudeMaxManager";
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/u;

const isValidId = (id: string): boolean => ID_PATTERN.test(id);

const rootPaths = (input: Readonly<{ join: Join; appData: string }>): RootPaths => {
  const root = input.join(input.appData, ROOT_NAME);
  return {
    root,
    presets: input.join(root, "global", "presets"),
    accounts: input.join(root, "accounts"),
    state: input.join(root, "state.json"),
  };
};

const accountPaths = (
  input: Readonly<{ join: Join; roots: RootPaths; id: string }>,
): AccountPaths => {
  const { join } = input;
  const root = join(input.roots.accounts, input.id);
  const home = join(root, "mcp-home");
  return {
    root,
    account: join(root, "account.json"),
    secrets: join(root, "secrets.bin"),
    managed: join(root, "managed.json"),
    desktop: join(root, "desktop"),
    code: join(root, "claude-code"),
    home: {
      home,
      appData: join(home, "AppData", "Roaming"),
      localAppData: join(home, "AppData", "Local"),
      mcpAuth: join(home, ".mcp-auth"),
    },
  };
};

export type { AccountPaths, RootPaths };
export { accountPaths, isValidId, rootPaths };
