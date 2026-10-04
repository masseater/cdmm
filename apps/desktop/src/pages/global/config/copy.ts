const COPY = {
  intro:
    "Global presets hold settings shared by several accounts. They never hold credentials: write {{secret:NAME}} and give each account its own value.",
  newPreset: "New preset name",
  create: "Create",
  name: "Name",
  mcp: "MCP servers (JSON)",
  mcpHelp:
    'Map of name to {"server": {"kind": "stdio", "command", "args", "env"} or {"kind": "http", "url", "headers"}, "targets": "desktop" | "code" | "both", "shareHome": false}.',
  codeSettings: "Claude Code settings.json (JSON)",
  rules: "Rules added to CLAUDE.md",
  save: "Save",
  delete: "Delete preset",
  usedBy: (labels: string): string => `Used by: ${labels}`,
  unused: "No account uses this preset.",
  invalid: (field: string, message: string): string => `${field}: ${message}`,
} as const;

export { COPY };
