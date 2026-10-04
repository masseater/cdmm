import { AccountSchema, emptyManaged, ManagedSchema, PresetSchema } from "@cdmm/core";
import type { Account, Managed, Preset } from "@cdmm/core";
import { Context, Effect, Layer, Option, Path, pipe, Schema } from "effect";
import type { Crypto, FileSystem, PlatformError } from "effect";

import { ManagerError } from "./errors.ts";
import {
  listDirectories,
  listJsonFiles,
  readDecoded,
  readText,
  removeTree,
  writeJson,
  writeText,
} from "./files.ts";
import type { WriteResult } from "./files.ts";
import { Host } from "./host.ts";
import { accountPaths, isValidId, rootPaths } from "./paths.ts";
import type { AccountPaths, RootPaths } from "./paths.ts";

const StateSchema = Schema.Struct({
  pendingLogins: Schema.Record(Schema.String, Schema.Finite),
  lastActiveId: Schema.String,
});

const SecretsSchema = Schema.Record(Schema.String, Schema.String);
const SecretsJson = Schema.fromJsonString(SecretsSchema);

type State = typeof StateSchema.Type;
type Secrets = typeof SecretsSchema.Type;
type StoreError = PlatformError.PlatformError | Schema.SchemaError | ManagerError;
type Io<Value> = Effect.Effect<Value, StoreError>;
type Platform = FileSystem.FileSystem | Path.Path | Crypto.Crypto;

type Base = Readonly<{
  roots: RootPaths;
  pathsOf: (id: string) => Io<AccountPaths>;
  run: <Value, Failure>(
    effect: Effect.Effect<Value, Failure, Platform>,
  ) => Effect.Effect<Value, Failure>;
  join: (...segments: readonly string[]) => string;
}>;

const DEFAULT_PRESET: Preset = {
  id: "default",
  name: "Default",
  mcp: {},
  codeSettings: {},
  rules: "",
};

const EMPTY_STATE: State = { pendingLogins: {}, lastActiveId: "" };
const NO_SECRETS: Secrets = {};

const decodePreset = Schema.decodeUnknownOption(PresetSchema);
const decodeAccount = Schema.decodeUnknownOption(AccountSchema);
const decodeManaged = Schema.decodeUnknownOption(ManagedSchema);
const decodeState = Schema.decodeUnknownOption(StateSchema);
const decodeSecrets = Schema.decodeUnknownOption(SecretsJson);
const encodeSecrets = Schema.encodeEffect(SecretsJson);

type StoreShape = Readonly<{
  roots: RootPaths;
  pathsOf: (id: string) => Io<AccountPaths>;
  presets: Io<readonly Preset[]>;
  savePreset: (preset: Preset) => Io<WriteResult>;
  deletePreset: (id: string) => Io<void>;
  accounts: Io<readonly Account[]>;
  saveAccount: (account: Account) => Io<WriteResult>;
  deleteAccount: (id: string) => Io<void>;
  managed: (id: string) => Io<Managed>;
  saveManaged: (input: Readonly<{ id: string; value: Managed }>) => Io<WriteResult>;
  state: Io<State>;
  saveState: (state: State) => Io<WriteResult>;
  secrets: (id: string) => Io<Secrets>;
  saveSecrets: (input: Readonly<{ id: string; value: Secrets }>) => Io<WriteResult>;
}>;

class Store extends Context.Service<Store, StoreShape>()("@cdmm/desktop/main/store") {}

const checkedId = (id: string): Effect.Effect<string, ManagerError> => {
  if (isValidId(id)) {
    return Effect.succeed(id);
  }
  return Effect.fail(new ManagerError({ message: `invalid id: ${id}` }));
};

const withDefaultPreset = (found: readonly Preset[]): readonly Preset[] => {
  if (found.some((preset) => preset.id === DEFAULT_PRESET.id)) {
    return found;
  }
  return [DEFAULT_PRESET, ...found];
};

const presetOps = (base: Base): Pick<StoreShape, "presets" | "savePreset" | "deletePreset"> => {
  const fileOf = (id: string): Io<string> =>
    checkedId(id).pipe(Effect.map((valid) => base.join(base.roots.presets, `${valid}.json`)));
  const presets = Effect.gen(function* presets() {
    const files = yield* base.run(listJsonFiles(base.roots.presets));
    const loaded = yield* pipe(
      files,
      Effect.forEach((file) => base.run(readDecoded({ path: file, decode: decodePreset }))),
    );
    return withDefaultPreset(loaded.flatMap((preset) => Option.toArray(preset)));
  });
  return {
    presets,
    savePreset: (preset: Preset): Io<WriteResult> =>
      fileOf(preset.id).pipe(
        Effect.flatMap((file) => base.run(writeJson({ path: file, value: preset }))),
      ),
    deletePreset: (id: string): Io<void> =>
      fileOf(id).pipe(Effect.flatMap((file) => base.run(removeTree(file)))),
  };
};

const accountOps = (base: Base): Pick<StoreShape, "accounts" | "saveAccount" | "deleteAccount"> => {
  const accounts = Effect.gen(function* accounts() {
    const names = yield* base.run(listDirectories(base.roots.accounts));
    const loaded = yield* pipe(
      names.filter((id) => isValidId(id)),
      Effect.forEach((id) =>
        base
          .pathsOf(id)
          .pipe(
            Effect.flatMap((paths) =>
              base.run(readDecoded({ path: paths.account, decode: decodeAccount })),
            ),
          ),
      ),
    );
    return loaded.flatMap((account) => Option.toArray(account));
  });
  return {
    accounts,
    saveAccount: (account: Account): Io<WriteResult> =>
      base
        .pathsOf(account.id)
        .pipe(
          Effect.flatMap((paths) => base.run(writeJson({ path: paths.account, value: account }))),
        ),
    deleteAccount: (id: string): Io<void> =>
      base.pathsOf(id).pipe(Effect.flatMap((paths) => base.run(removeTree(paths.root)))),
  };
};

const managedOps = (
  base: Base,
): Pick<StoreShape, "managed" | "saveManaged" | "state" | "saveState"> => {
  const orEmpty = Option.getOrElse(() => emptyManaged);
  const orFresh = Option.getOrElse(() => EMPTY_STATE);
  return {
    managed: (id: string): Io<Managed> =>
      base.pathsOf(id).pipe(
        Effect.flatMap((paths) =>
          base.run(readDecoded({ path: paths.managed, decode: decodeManaged })),
        ),
        Effect.map(orEmpty),
      ),
    saveManaged: (input: Readonly<{ id: string; value: Managed }>): Io<WriteResult> =>
      base
        .pathsOf(input.id)
        .pipe(
          Effect.flatMap((paths) =>
            base.run(writeJson({ path: paths.managed, value: input.value })),
          ),
        ),
    state: base
      .run(readDecoded({ path: base.roots.state, decode: decodeState }))
      .pipe(Effect.map(orFresh)),
    saveState: (value: State): Io<WriteResult> =>
      base.run(writeJson({ path: base.roots.state, value })),
  };
};

const secretOps = (
  input: Readonly<{ base: Base; host: Host["Service"] }>,
): Pick<StoreShape, "secrets" | "saveSecrets"> => {
  const { base, host } = input;
  const secrets = Effect.fn("Store.secrets")(function* secrets(id: string) {
    const paths = yield* base.pathsOf(id);
    const sealed = yield* base.run(readText(paths.secrets));
    if (Option.isNone(sealed)) {
      return NO_SECRETS;
    }
    const plain = yield* host.decrypt(sealed.value);
    return Option.getOrElse(decodeSecrets(plain), () => NO_SECRETS);
  });
  const saveSecrets = Effect.fn("Store.saveSecrets")(function* saveSecrets(
    spec: Readonly<{ id: string; value: Secrets }>,
  ) {
    const paths = yield* base.pathsOf(spec.id);
    const plain = yield* encodeSecrets(spec.value);
    const sealed = yield* host.encrypt(plain);
    return yield* base.run(writeText({ path: paths.secrets, text: sealed }));
  });
  return { secrets, saveSecrets };
};

const makeStore = Effect.gen(function* makeStore() {
  const host = yield* Host;
  const path = yield* Path.Path;
  const context = yield* Effect.context<Platform>();
  const join = (...segments: readonly string[]): string => path.join(...segments);
  const roots = rootPaths({ join, appData: host.appData });
  const base: Base = {
    roots,
    join,
    pathsOf: (id) =>
      checkedId(id).pipe(Effect.map((valid) => accountPaths({ join, roots, id: valid }))),
    run: (effect) => Effect.provideContext(effect, context),
  };
  return Store.of({
    roots,
    pathsOf: base.pathsOf,
    ...presetOps(base),
    ...accountOps(base),
    ...managedOps(base),
    ...secretOps({ base, host }),
  });
});

const storeLayer = Layer.effect(Store, makeStore);

export type { StoreError };
export { Store, storeLayer };
