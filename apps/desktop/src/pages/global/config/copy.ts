const COPY = {
  newPreset: "New preset name",
  create: "Add",
  name: "Name",
  mcp: "MCP servers (JSON)",
  mcpHelp:
    'Map of name to {"server": {"kind": "stdio", "command", "args", "env"} or {"kind": "http", "url", "headers"}, "targets": "desktop" | "code" | "both", "shareHome": false}. Write credentials as {{secret:NAME}} and set the value in each account.',
  codeSettings: "Claude Code settings.json (JSON)",
  rules: "CLAUDE.md rules",
  save: "Save",
  delete: "Delete preset",
  unused: "Unused",
  invalid: (field: string, message: string): string => `${field}: ${message}`,
} as const;

export { COPY };
