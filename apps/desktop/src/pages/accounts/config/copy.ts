const COPY = {
  newAccount: "New profile name",
  add: "Add",
  label: "Name",
  preset: "Global preset",
  noAccount: "Add a profile, then sign in with its Claude Max subscription.",
  start: "Start",
  signIn: "Sign in",
  stop: "Stop",
  launchCode: "Claude Code",
  settings: "Settings",
  openFolder: "Open folder",
  delete: "Delete profile",
  confirmDelete: "Click again to delete",
  mismatch: (expected: string, actual: string): string =>
    `Signed in as ${actual}, but this profile was set up for ${expected}.`,
  bind: "Use the current sign-in",
  skipped: (names: string): string => `Skipped because they are links: ${names}`,
  missingSecrets: (names: string): string => `Missing secrets: ${names}`,
  syncFailed: (message: string): string => `Could not write files: ${message}`,
  save: "Save",
  override: "Override JSON",
  overrideHelp:
    "Wins over the Global preset for this profile: disabledMcp, mcp, codeSettings, rules. Use {{secret:NAME}} for credentials.",
  secrets: "Secrets",
  secretName: "Name",
  secretValue: "Value",
  addSecret: "Save secret",
  remove: "Remove",
} as const;

export { COPY };
