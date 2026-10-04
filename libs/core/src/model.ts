import { Schema } from "effect";

const StringMapSchema = Schema.Record(Schema.String, Schema.String);

const StdioServerSchema = Schema.Struct({
  kind: Schema.Literal("stdio"),
  command: Schema.String,
  args: Schema.Array(Schema.String),
  env: StringMapSchema,
});

const HttpServerSchema = Schema.Struct({
  kind: Schema.Literal("http"),
  url: Schema.String,
  headers: StringMapSchema,
});

const McpServerSchema = Schema.Union([StdioServerSchema, HttpServerSchema]);

const McpEntrySchema = Schema.Struct({
  server: McpServerSchema,
  targets: Schema.Literals(["desktop", "code", "both"]),
  shareHome: Schema.Boolean,
});

const SettingsSchema = Schema.Record(Schema.String, Schema.Unknown);

const McpMapSchema = Schema.Record(Schema.String, McpEntrySchema);

const PresetSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  mcp: McpMapSchema,
  codeSettings: SettingsSchema,
  rules: Schema.String,
});

const AccountOverrideSchema = Schema.Struct({
  disabledMcp: Schema.Array(Schema.String),
  mcp: McpMapSchema,
  codeSettings: SettingsSchema,
  rules: Schema.String,
});

const AccountSchema = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  color: Schema.String,
  presetId: Schema.String,
  override: AccountOverrideSchema,
  boundAccountUuid: Schema.optionalKey(Schema.String),
});

const ManagedSchema = Schema.Struct({
  desktopMcp: Schema.Array(Schema.String),
  codeMcp: Schema.Array(Schema.String),
  codeSettings: Schema.Array(Schema.String),
});

type McpServer = typeof McpServerSchema.Type;
type McpEntry = typeof McpEntrySchema.Type;
type McpMap = typeof McpMapSchema.Type;
type Settings = typeof SettingsSchema.Type;
type Preset = typeof PresetSchema.Type;
type AccountOverride = typeof AccountOverrideSchema.Type;
type Account = typeof AccountSchema.Type;
type Managed = typeof ManagedSchema.Type;

const emptyOverride: AccountOverride = { disabledMcp: [], mcp: {}, codeSettings: {}, rules: "" };
const emptyManaged: Managed = { desktopMcp: [], codeMcp: [], codeSettings: [] };

export type { Account, AccountOverride, Managed, McpEntry, McpMap, McpServer, Preset, Settings };
export {
  AccountOverrideSchema,
  AccountSchema,
  emptyManaged,
  emptyOverride,
  ManagedSchema,
  McpMapSchema,
  PresetSchema,
  SettingsSchema,
};
