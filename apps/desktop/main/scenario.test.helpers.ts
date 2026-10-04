import { asRecord } from "@claude-max-manager/core";
import type { Account, McpEntry, Preset } from "@claude-max-manager/core";
import { Effect, FileSystem, Option, Path, pipe, Ref } from "effect";

import { ManagerError } from "./errors.ts";
import { readJson, writeJson } from "./files.ts";
import { Recorder } from "./harness.test.helpers.ts";
import { handlers } from "./manager.ts";
import { Store } from "./store.ts";
import { overview } from "./views.ts";

const GITHUB: McpEntry = {
  server: {
    kind: "http",
    url: "https://api.githubcopilot.com/mcp/",
    headers: { Authorization: "Bearer {{secret:GITHUB}}" },
  },
  targets: "both",
  shareHome: false,
};

const WORK: Preset = {
  id: "work",
  name: "Work",
  mcp: { github: GITHUB },
  codeSettings: { model: "opus" },
  rules: "Work rules",
};

const createAccount = Effect.fn("createAccount")(function* createAccount(
  input: Readonly<{ label: string; presetId: string }>,
) {
  yield* handlers.createAccount({ label: input.label, color: "#888888", presetId: input.presetId });
  const view = yield* overview;
  const found = Option.fromNullishOr(
    view.accounts.find((each) => each.account.label === input.label),
  );
  if (Option.isNone(found)) {
    return yield* new ManagerError({ message: `account ${input.label} was not created` });
  }
  return found.value.account;
});

const accountFile = Effect.fn("accountFile")(function* accountFile(
  input: Readonly<{ account: Account; parts: readonly string[] }>,
) {
  const store = yield* Store;
  const path = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const paths = yield* store.pathsOf(input.account.id);
  return yield* fs.readFileString(path.join(paths.root, ...input.parts));
});

const accountJson = Effect.fn("accountJson")(function* accountJson(
  input: Readonly<{ account: Account; parts: readonly string[] }>,
) {
  const store = yield* Store;
  const path = yield* Path.Path;
  const paths = yield* store.pathsOf(input.account.id);
  const json = yield* readJson(path.join(paths.root, ...input.parts));
  return Option.getOrNull(json);
});

const addHandWrittenServer = Effect.fn("addHandWrittenServer")(function* addHandWrittenServer(
  account: Account,
) {
  const store = yield* Store;
  const path = yield* Path.Path;
  const paths = yield* store.pathsOf(account.id);
  const file = path.join(paths.desktop, "claude_desktop_config.json");
  const current = asRecord(Option.getOrNull(yield* readJson(file)));
  const mcpServers = { ...asRecord(current["mcpServers"]), mine: { command: "mine", args: [] } };
  yield* writeJson({ path: file, value: { ...current, mcpServers } });
});

const treeText = Effect.fn("treeText")(function* treeText(root: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* fs.readDirectory(root, { recursive: true });
  const texts = yield* pipe(
    entries,
    Effect.forEach((entry) =>
      fs.readFileString(path.join(root, entry)).pipe(Effect.orElseSucceed(() => "")),
    ),
  );
  return texts.join("\n");
});

const setRunning = Effect.fn("setRunning")(function* setRunning(accounts: readonly Account[]) {
  const store = yield* Store;
  const recorder = yield* Recorder;
  const dirs = yield* pipe(
    accounts,
    Effect.forEach((account) =>
      store.pathsOf(account.id).pipe(Effect.map((paths) => paths.desktop)),
    ),
  );
  yield* Ref.set(recorder.running, new Set(dirs));
});

const signInAs = Effect.fn("signInAs")(function* signInAs(
  input: Readonly<{ account: Account; uuid: string }>,
) {
  const store = yield* Store;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const paths = yield* store.pathsOf(input.account.id);
  yield* fs.makeDirectory(paths.desktop, { recursive: true });
  yield* fs.writeFileString(
    path.join(paths.desktop, "config.json"),
    `{"lastKnownAccountUuid":"${input.uuid}"}`,
  );
});

export {
  accountFile,
  accountJson,
  addHandWrittenServer,
  createAccount,
  GITHUB,
  setRunning,
  signInAs,
  treeText,
  WORK,
};
