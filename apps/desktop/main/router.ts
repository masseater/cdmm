import type { RouterStatus } from "@cdmm/core";
import { Effect } from "effect";
import type { ChildProcessSpawner } from "effect/process";

import type { ManagerError } from "./errors.ts";
import { checked, output } from "./spawn.ts";

const PROG_ID = "cdmm.Url";
const APP_NAME = "cdmm";
const APP_KEY = String.raw`HKCU\Software\cdmm`;
const CLASSES_KEY = String.raw`HKCU\Software\Classes\cdmm.Url`;
const REGISTERED_APPS = String.raw`HKCU\Software\RegisteredApplications`;
const ASSOCIATION = String.raw`HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\claude`;

const defaultAppsSettings = `ms-settings:defaultapps?registeredAppUser=${APP_NAME}`;

const routeCommand = (executable: string): string => `"${executable}" --route -- "%1"`;

const registryEntries = (executable: string): readonly (readonly string[])[] => [
  [CLASSES_KEY, "/ve", "/d", "URL:Claude (Claude Max Desktop Manager)"],
  [CLASSES_KEY, "/v", "URL Protocol", "/d", ""],
  [String.raw`${CLASSES_KEY}\DefaultIcon`, "/ve", "/d", executable],
  [String.raw`${CLASSES_KEY}\shell\open\command`, "/ve", "/d", routeCommand(executable)],
  [
    String.raw`${APP_KEY}\Capabilities`,
    "/v",
    "ApplicationName",
    "/d",
    "Claude Max Desktop Manager",
  ],
  [
    String.raw`${APP_KEY}\Capabilities`,
    "/v",
    "ApplicationDescription",
    "/d",
    "Opens claude:// links in the Claude account they belong to",
  ],
  [String.raw`${APP_KEY}\Capabilities\URLAssociations`, "/v", "claude", "/d", PROG_ID],
  [REGISTERED_APPS, "/v", APP_NAME, "/d", String.raw`Software\cdmm\Capabilities`],
];

const queryValue = (
  key: string,
  name: string,
): Effect.Effect<string, never, ChildProcessSpawner.ChildProcessSpawner> =>
  output({ command: "reg.exe", args: ["query", key, "/v", name] });

const routerStatus = Effect.fn("Desktop.routerStatus")(function* routerStatus(executable: string) {
  const command = yield* output({
    command: "reg.exe",
    args: ["query", String.raw`${CLASSES_KEY}\shell\open\command`, "/ve"],
  });
  const registered = yield* queryValue(REGISTERED_APPS, APP_NAME);
  if (!command.includes(routeCommand(executable)) || !registered.includes(APP_NAME)) {
    return { status: "unregistered" } satisfies RouterStatus;
  }
  const latest = yield* queryValue(String.raw`${ASSOCIATION}\UserChoiceLatest\ProgId`, "ProgId");
  const legacy = yield* queryValue(String.raw`${ASSOCIATION}\UserChoice`, "ProgId");
  if (`${latest}${legacy}`.includes(PROG_ID)) {
    return { status: "active" } satisfies RouterStatus;
  }
  return { status: "registered" } satisfies RouterStatus;
});

const registerRouterFor = (
  executable: string,
): Effect.Effect<void, ManagerError, ChildProcessSpawner.ChildProcessSpawner> =>
  Effect.forEach(
    registryEntries(executable),
    (entry) => checked({ command: "reg.exe", args: ["add", ...entry, "/f"], env: {} }),
    { discard: true },
  );

export { defaultAppsSettings, registerRouterFor, routerStatus };
