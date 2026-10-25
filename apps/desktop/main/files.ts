import { Crypto, Effect, FileSystem, Option, Path, pipe, Schema } from "effect";

type WriteResult = "written" | "skipped-link";

const PRIVATE_FILE = 0o600;
const JSON_INDENT = 2;

const parseJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown));
const printJson = Schema.encodeUnknownEffect(
  Schema.fromJsonString(Schema.Unknown, { space: JSON_INDENT }),
);

const readText = Effect.fn("readText")(function* readText(path: string) {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs.readFileString(path).pipe(
    Effect.asSome,
    Effect.catchReason("PlatformError", "NotFound", () => Effect.succeed(Option.none<string>())),
  );
});

const readJson = Effect.fn("readJson")(function* readJson(path: string) {
  const text = yield* readText(path);
  return text.pipe(Option.flatMap((value) => parseJson(value)));
});

const readDecoded = Effect.fn("readDecoded")(function* readDecoded<Value>(
  input: Readonly<{ path: string; decode: (value: unknown) => Option.Option<Value> }>,
) {
  const json = yield* readJson(input.path);
  return json.pipe(Option.flatMap((value) => input.decode(value)));
});

const isLink = Effect.fn("isLink")(function* isLink(path: string) {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs
    .readLink(path)
    .pipe(Effect.match({ onSuccess: () => true, onFailure: () => false }));
});

const writeText = Effect.fn("writeText")(function* writeText(
  input: Readonly<{ path: string; text: string }>,
) {
  if (yield* isLink(input.path)) {
    return "skipped-link" satisfies WriteResult;
  }
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const crypto = yield* Crypto.Crypto;
  yield* fs.makeDirectory(path.dirname(input.path), { recursive: true });
  const temporary = `${input.path}.${yield* crypto.randomUUIDv4}.tmp`;
  yield* fs.writeFileString(temporary, input.text, { mode: PRIVATE_FILE });
  yield* fs.rename(temporary, input.path);
  return "written" satisfies WriteResult;
});

const writeJson = Effect.fn("writeJson")(function* writeJson(
  input: Readonly<{ path: string; value: unknown }>,
) {
  const text = yield* printJson(input.value);
  return yield* writeText({
    path: input.path,
    text: `${text}
`,
  });
});

const listEntries = Effect.fn("listEntries")(function* listEntries(path: string) {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs
    .readDirectory(path)
    .pipe(
      Effect.catchReason("PlatformError", "NotFound", () => Effect.succeed<readonly string[]>([])),
    );
});

const listDirectories = Effect.fn("listDirectories")(function* listDirectories(path: string) {
  const fs = yield* FileSystem.FileSystem;
  const join = yield* Path.Path;
  const names = yield* listEntries(path);
  const kinds = yield* pipe(
    names,
    Effect.forEach((name) =>
      fs.stat(join.join(path, name)).pipe(Effect.map((info) => ({ name, type: info.type }))),
    ),
  );
  return kinds.filter((entry) => entry.type === "Directory").map((entry) => entry.name);
});

const listJsonFiles = Effect.fn("listJsonFiles")(function* listJsonFiles(path: string) {
  const join = yield* Path.Path;
  const names = yield* listEntries(path);
  return names.filter((name) => name.endsWith(".json")).map((name) => join.join(path, name));
});

const removeTree = Effect.fn("removeTree")(function* removeTree(path: string) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.remove(path, { recursive: true, force: true });
});

export type { WriteResult };
export {
  listDirectories,
  listJsonFiles,
  readDecoded,
  readJson,
  readText,
  removeTree,
  writeJson,
  writeText,
};
