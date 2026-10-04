import { asRecord, render, resolveEffective } from "@claude-max-manager/core";
import type { Account, SyncStatus } from "@claude-max-manager/core";
import { Effect, Option, Path, Ref } from "effect";

import { readJson, readText, writeJson, writeText } from "./files.ts";
import type { WriteResult } from "./files.ts";
import { Session } from "./session.ts";
import { Store } from "./store.ts";

const DESKTOP_CONFIG = "claude_desktop_config.json";
const CODE_CONFIG = ".claude.json";
const CODE_SETTINGS = "settings.json";
const RULES = "CLAUDE.md";

const recordAt = Effect.fn("recordAt")(function* recordAt(path: string) {
  const json = yield* readJson(path);
  return asRecord(Option.getOrNull(json));
});

const filesOf = Effect.fn("filesOf")(function* filesOf(accountId: string) {
  const store = yield* Store;
  const path = yield* Path.Path;
  const paths = yield* store.pathsOf(accountId);
  return {
    paths,
    desktopConfig: path.join(paths.desktop, DESKTOP_CONFIG),
    codeConfig: path.join(paths.code, CODE_CONFIG),
    codeSettings: path.join(paths.code, CODE_SETTINGS),
    rules: path.join(paths.code, RULES),
  };
});

const renderFor = Effect.fn("renderFor")(function* renderFor(account: Account) {
  const store = yield* Store;
  const files = yield* filesOf(account.id);
  const presets = yield* store.presets;
  const preset = Option.fromNullishOr(presets.find((each) => each.id === account.presetId));
  const rules = yield* readText(files.rules);
  return {
    files,
    result: render({
      effective: resolveEffective({ preset, override: account.override }),
      current: {
        desktopConfig: yield* recordAt(files.desktopConfig),
        codeConfig: yield* recordAt(files.codeConfig),
        codeSettings: yield* recordAt(files.codeSettings),
        rules: Option.getOrElse(rules, () => ""),
      },
      managed: yield* store.managed(account.id),
      context: { secrets: yield* store.secrets(account.id), home: files.paths.home },
    }),
  };
});

const writeAccountFiles = Effect.fn("writeAccountFiles")(function* writeAccountFiles(
  account: Account,
) {
  const store = yield* Store;
  const { files, result } = yield* renderFor(account);
  if (result.status === "missing-secrets") {
    return result satisfies SyncStatus;
  }
  const written: readonly (readonly [string, WriteResult])[] = [
    [
      DESKTOP_CONFIG,
      yield* writeJson({ path: files.desktopConfig, value: result.value.desktopConfig }),
    ],
    [CODE_CONFIG, yield* writeJson({ path: files.codeConfig, value: result.value.codeConfig })],
    [
      CODE_SETTINGS,
      yield* writeJson({ path: files.codeSettings, value: result.value.codeSettings }),
    ],
    [RULES, yield* writeText({ path: files.rules, text: result.value.rules })],
  ];
  yield* store.saveManaged({ id: account.id, value: result.value.managed });
  const skipped = written.filter(([, outcome]) => outcome === "skipped-link").map(([name]) => name);
  return { status: "synced", skipped } satisfies SyncStatus;
});

const syncAccount = Effect.fn("syncAccount")(function* syncAccount(account: Account) {
  const session = yield* Session;
  const status = yield* writeAccountFiles(account).pipe(
    Effect.catch((error) =>
      Effect.succeed({ status: "failed", message: error.message } satisfies SyncStatus),
    ),
  );
  yield* Ref.update(session.syncResults, (current) => new Map([...current, [account.id, status]]));
  return status;
});

const syncStatus = Effect.fn("syncStatus")(function* syncStatus(account: Account) {
  const session = yield* Session;
  const results = yield* Ref.get(session.syncResults);
  return Option.getOrElse(Option.fromNullishOr(results.get(account.id)), (): SyncStatus => ({
    status: "pending",
  }));
});

const syncAll = Effect.fn("syncAll")(function* syncAll() {
  const store = yield* Store;
  const accounts = yield* store.accounts;
  yield* Effect.forEach(accounts, (account) => syncAccount(account), { discard: true });
});

const syncPreset = Effect.fn("syncPreset")(function* syncPreset(presetId: string) {
  const store = yield* Store;
  const accounts = yield* store.accounts;
  yield* Effect.forEach(
    accounts.filter((account) => account.presetId === presetId),
    (account) => syncAccount(account),
    { discard: true },
  );
});

export { syncAccount, syncAll, syncPreset, syncStatus };
