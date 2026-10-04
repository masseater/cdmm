const COPY = {
  title: "Claude Max Manager",
  accounts: "Accounts",
  global: "Global",
  desktopMissing: "Claude Desktop not installed",
  windowsOnly: "Windows only",
  desktopVersion: (version: string): string => `Claude Desktop ${version}`,
  desktopUntested: (version: string): string => `Claude Desktop ${version} (untested version)`,
  routerActive: "claude:// links routed",
  routerSetup: "Route claude:// links here",
  choiceQuestion: "Which account should open this Claude link?",
  ignore: "Ignore",
} as const;

export { COPY };
