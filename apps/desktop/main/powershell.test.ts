import { Effect, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { describe, expect, it } from "vite-plus/test";

import { runTest } from "./harness.test.helpers.ts";
import { NO_DIR_EXIT, STOP_SCRIPT } from "./powershell.ts";

const PARSE = [
  "$errors = $null",
  "[void][System.Management.Automation.Language.Parser]::ParseInput($env:CMM_SCRIPT, [ref]$null, [ref]$errors)",
  "$errors.Count",
].join("; ");

type Pwsh = Readonly<{ command: string; env: Readonly<Record<string, string>> }>;

const commandOf = (input: Pwsh): ChildProcess.Command =>
  ChildProcess.make("pwsh", ["-NoProfile", "-NonInteractive", "-Command", input.command], {
    env: { ...input.env },
    extendEnv: true,
  });

const outputOf = (input: Pwsh): Promise<string> =>
  runTest(
    ChildProcessSpawner.ChildProcessSpawner.pipe(
      Effect.flatMap((spawner) => spawner.string(commandOf(input))),
      Effect.map(Str.trim),
    ),
  );

const exitCodeOf = (input: Pwsh): Promise<number> =>
  runTest(
    ChildProcessSpawner.ChildProcessSpawner.pipe(
      Effect.flatMap((spawner) => spawner.exitCode(commandOf(input))),
      Effect.map(Number),
    ),
  );

describe("STOP_SCRIPT", () => {
  it("parses as PowerShell", () =>
    expect(outputOf({ command: PARSE, env: { CMM_SCRIPT: STOP_SCRIPT } })).resolves.toBe("0"));

  it("stops nothing when no data directory is given", () =>
    expect(exitCodeOf({ command: STOP_SCRIPT, env: { CMM_USER_DATA_DIR: "" } })).resolves.toBe(
      NO_DIR_EXIT,
    ));
});
