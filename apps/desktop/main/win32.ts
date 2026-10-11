import { Data, Effect, Option } from "effect";

const DESKTOP_ALL_ACCESS = 0x10_00_00_00;
const CREATE_UNICODE_ENVIRONMENT = 0x00_00_04_00;
const NULL_PTR = 0;
const WAIT_DONE = 0;
const ENV_BYTES = 262_144;

const STARTUP_LAYOUT: Record<string, string> = {
  cb: "uint32",
  reserved0: "void *",
  desktop: "char16_t *",
  title: "void *",
  posX: "uint32",
  posY: "uint32",
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
};
const PROCESS_LAYOUT: Record<string, string> = {
  process: "void *",
  thread: "void *",
  pid: "uint32",
  tid: "uint32",
};

class Win32Error extends Data.TaggedError("Win32Error")<{ message: string }> {}

interface Call {
  (...args: readonly unknown[]): unknown;
  readonly async: (...args: readonly unknown[]) => void;
}

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
type SpawnInput = Readonly<{ desktop: string; cmd: string; env: Readonly<Record<string, string>> }>;
type ProcessInfo = Readonly<{ process: unknown; thread: unknown; pid: number }>;
type Native = Readonly<{
  startupSize: number;
  createDesktop: Call;
  createProcess: Call;
  waitForInputIdle: Call;
  waitForSingleObject: Call;
  closeHandle: Call;
  readEnv: () => readonly string[];
}>;
type Win32 = Readonly<{
  launch: (input: LaunchInput) => Effect.Effect<void, Win32Error>;
  run: (input: RunInput) => Effect.Effect<void, Win32Error>;
}>;

const fail = (cause: unknown, fallback: string): Win32Error => {
  if (cause instanceof Error) {
    return new Win32Error({ message: cause.message });
  }
  return new Win32Error({ message: fallback });
};

const nameOf = (entry: string): string => {
  const [head = ""] = entry.split("=");
  return head;
};

const decodeInfo = (info: Readonly<Record<string, unknown>>): ProcessInfo => ({
  process: info["process"],
  thread: info["thread"],
  pid: Number(info["pid"]),
});

const entriesOf = (decoded: unknown): readonly string[] => {
  if (!(decoded instanceof Uint8Array)) {
    return [];
  }
  const full = new TextDecoder("utf-16le").decode(decoded);
  const [block = ""] = full.split("\0\0");
  return block.split("\0").filter(Boolean);
};

const loadNative: Effect.Effect<Native, Win32Error> = Effect.gen(function* loadBindings() {
  const mod = yield* Effect.tryPromise({
    try: () => import("koffi"),
    catch: (cause) => fail(cause, "koffi import failed"),
  });
  const user32 = mod.load("user32.dll");
  const kernel32 = mod.load("kernel32.dll");
  const startupSize = mod.sizeof(mod.struct("CdmmStartupInfo", STARTUP_LAYOUT));
  mod.struct("CdmmProcessInfo", PROCESS_LAYOUT);
  const getEnv = kernel32.func("void * GetEnvironmentStringsW()");
  const freeEnv = kernel32.func("bool FreeEnvironmentStringsW(void *)");
  const envType = mod.array("uint8", ENV_BYTES, "Typed");
  const readEnv = (): readonly string[] => {
    const pointer: unknown = getEnv();
    const decoded: unknown = mod.decode(pointer, envType);
    freeEnv(pointer);
    return entriesOf(decoded);
  };
  return {
    startupSize,
    createDesktop: user32.func(
      "void * CreateDesktopW(char16_t *, void *, void *, uint32, uint32, void *)",
    ),
    createProcess: kernel32.func(
      "bool CreateProcessW(char16_t *, char16_t *, void *, void *, bool, uint32, void *, char16_t *, CdmmStartupInfo *, _Out_ CdmmProcessInfo *)",
    ),
    waitForInputIdle: user32.func("uint32 WaitForInputIdle(void *, uint32)"),
    waitForSingleObject: kernel32.func("uint32 WaitForSingleObject(void *, uint32)"),
    closeHandle: kernel32.func("bool CloseHandle(void *)"),
    readEnv,
  };
});

let memo: Option.Option<Native> = Option.none();
const native: Effect.Effect<Native, Win32Error> = Effect.suspend(() =>
  Option.match(memo, {
    onSome: (value) => Effect.succeed(value),
    onNone: () =>
      loadNative.pipe(
        Effect.tap((value) =>
          Effect.sync(() => {
            memo = Option.some(value);
          }),
        ),
      ),
  }),
);

const environmentBlock = (bound: Native, overrides: Readonly<Record<string, string>>): Buffer => {
  const overridden = new Set(Object.keys(overrides));
  const kept = bound.readEnv().filter((entry) => !overridden.has(nameOf(entry)));
  const added = Object.entries(overrides).map(([key, value]) => `${key}=${value}`);
  const text = `${[...kept, ...added].join("\0")}\0\0`;
  return Buffer.from(text, "utf16le");
};

const startupFor = (bound: Native, desktop: string): Readonly<Record<string, unknown>> => ({
  cb: bound.startupSize,
  desktop: `WinSta0\\${desktop}`,
});

const spawn = (bound: Native, input: SpawnInput): Effect.Effect<ProcessInfo, Win32Error> =>
  Effect.gen(function* performSpawn() {
    const station: unknown = bound.createDesktop(
      input.desktop,
      NULL_PTR,
      NULL_PTR,
      NULL_PTR,
      DESKTOP_ALL_ACCESS,
      NULL_PTR,
    );
    if (Option.isNone(Option.fromNullishOr(station))) {
      return yield* new Win32Error({ message: "CreateDesktop failed" });
    }
    const info: Record<string, unknown> = {};
    const ok: unknown = bound.createProcess(
      NULL_PTR,
      input.cmd,
      NULL_PTR,
      NULL_PTR,
      false,
      CREATE_UNICODE_ENVIRONMENT,
      environmentBlock(bound, input.env),
      NULL_PTR,
      startupFor(bound, input.desktop),
      info,
    );
    if (ok !== true) {
      return yield* new Win32Error({ message: "CreateProcess failed" });
    }
    return decodeInfo(info);
  });

const waitHandle = (call: Call, handle: unknown, ms: number): Effect.Effect<number> =>
  Effect.callback<number>((resume) => {
    call.async(handle, ms, () => {
      resume(Effect.succeed(WAIT_DONE));
    });
  });

const launch = (input: LaunchInput): Effect.Effect<void, Win32Error> =>
  Effect.gen(function* performLaunch() {
    const bound = yield* native;
    const info = yield* spawn(bound, input);
    yield* waitHandle(bound.waitForInputIdle, info.process, input.waitMs);
    bound.closeHandle(info.thread);
    bound.closeHandle(info.process);
  });

const run = (input: RunInput): Effect.Effect<void, Win32Error> =>
  Effect.gen(function* performRun() {
    const bound = yield* native;
    const info = yield* spawn(bound, input);
    bound.closeHandle(info.thread);
    yield* waitHandle(bound.waitForSingleObject, info.process, input.timeoutMs);
    bound.closeHandle(info.process);
  });

const win32: Win32 = { launch, run };

export type { LaunchInput, RunInput, Win32 };
export { win32 };
