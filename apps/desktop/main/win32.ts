import { createRequire } from "node:module";

interface KoffiFunc {
  (...args: readonly unknown[]): unknown;
  async: (...args: readonly unknown[]) => void;
}
type KoffiLib = Readonly<{ func: (signature: string) => KoffiFunc }>;
type Koffi = Readonly<{
  load: (dll: string) => KoffiLib;
  struct: (name: string, fields: Readonly<Record<string, string>>) => unknown;
  sizeof: (type: unknown) => number;
}>;

type ProcessInfo = Readonly<{ process: unknown; thread: unknown; pid: number }>;
type SpawnInput = Readonly<{
  desktop: string;
  cmd: string;
  env: Readonly<Record<string, string>>;
}>;
type LaunchInput = Readonly<{
  desktop: string;
  cmd: string;
  env: Readonly<Record<string, string>>;
  waitMs: number;
}>;
type RunInput = Readonly<{
  desktop: string;
  cmd: string;
  env: Readonly<Record<string, string>>;
  timeoutMs: number;
}>;
type Win32 = Readonly<{
  launch: (input: LaunchInput) => Promise<void>;
  run: (input: RunInput) => Promise<void>;
}>;

const DESKTOP_ALL_ACCESS = 0x10000000;
const CREATE_UNICODE_ENVIRONMENT = 0x00000400;

const environmentBlock = (overrides: Readonly<Record<string, string>>): Buffer => {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = value;
  }
  const text = `${Object.entries(merged)
    .map(([key, value]) => `${key}=${value}`)
    .join("\0")}\0\0`;
  return Buffer.from(text, "utf16le");
};

const build = (): Win32 => {
  const require = createRequire(import.meta.url);
  const koffi = require("koffi") as Koffi;
  const user32 = koffi.load("user32.dll");
  const kernel32 = koffi.load("kernel32.dll");
  const startupInfo = koffi.struct("CdmmStartupInfo", {
    cb: "uint32",
    reserved0: "void *",
    desktop: "char16_t *",
    title: "void *",
    x: "uint32",
    y: "uint32",
    xSize: "uint32",
    ySize: "uint32",
    xCount: "uint32",
    yCount: "uint32",
    fill: "uint32",
    flags: "uint32",
    show: "uint16",
    reserved2: "uint16",
    reserved3: "void *",
    stdInput: "void *",
    stdOutput: "void *",
    stdError: "void *",
  });
  koffi.struct("CdmmProcessInfo", {
    process: "void *",
    thread: "void *",
    pid: "uint32",
    tid: "uint32",
  });
  const createDesktop = user32.func(
    "void * CreateDesktopW(char16_t *, void *, void *, uint32, uint32, void *)",
  );
  const createProcess = kernel32.func(
    "bool CreateProcessW(char16_t *, char16_t *, void *, void *, bool, uint32, void *, char16_t *, CdmmStartupInfo *, _Out_ CdmmProcessInfo *)",
  );
  const waitForInputIdle = user32.func("uint32 WaitForInputIdle(void *, uint32)");
  const waitForSingleObject = kernel32.func("uint32 WaitForSingleObject(void *, uint32)");
  const closeHandle = kernel32.func("bool CloseHandle(void *)");

  const startupFor = (desktop: string): Readonly<Record<string, unknown>> => ({
    cb: koffi.sizeof(startupInfo),
    reserved0: null,
    desktop: `WinSta0\\${desktop}`,
    title: null,
    x: 0,
    y: 0,
    xSize: 0,
    ySize: 0,
    xCount: 0,
    yCount: 0,
    fill: 0,
    flags: 0,
    show: 0,
    reserved2: 0,
    reserved3: null,
    stdInput: null,
    stdOutput: null,
    stdError: null,
  });

  const spawn = (input: SpawnInput): Promise<ProcessInfo> =>
    new Promise((resolve, reject) => {
      const station = createDesktop(input.desktop, null, null, 0, DESKTOP_ALL_ACCESS, null);
      if (station === null) {
        reject(new Error("CreateDesktop failed"));
        return;
      }
      const info: Record<string, unknown> = {};
      createProcess.async(
        null,
        input.cmd,
        null,
        null,
        false,
        CREATE_UNICODE_ENVIRONMENT,
        environmentBlock(input.env),
        null,
        startupFor(input.desktop),
        info,
        (error: unknown, ok: unknown) => {
          if (error !== null || ok !== true) {
            reject(error instanceof Error ? error : new Error("CreateProcess failed"));
            return;
          }
          resolve(info as unknown as ProcessInfo);
        },
      );
    });

  const wait = (handle: unknown, call: KoffiFunc, ms: number): Promise<void> =>
    new Promise((resolve) => {
      call.async(handle, ms, () => {
        resolve();
      });
    });

  return {
    launch: async (input) => {
      const info = await spawn(input);
      await wait(info.process, waitForInputIdle, input.waitMs);
      closeHandle(info.thread);
      closeHandle(info.process);
    },
    run: async (input) => {
      const info = await spawn(input);
      closeHandle(info.thread);
      await wait(info.process, waitForSingleObject, input.timeoutMs);
      closeHandle(info.process);
    },
  };
};

let cached: Win32 | undefined;
const win32 = (): Win32 => {
  cached ??= build();
  return cached;
};

export type { LaunchInput, RunInput, Win32 };
export { win32 };
