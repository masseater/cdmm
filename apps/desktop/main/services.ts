import type { Crypto, FileSystem, Path } from "effect";

import type { Desktop } from "./desktop.ts";
import type { Host } from "./host.ts";
import type { Session } from "./session.ts";
import type { Store } from "./store.ts";

type ManagerServices =
  | Store
  | Desktop
  | Host
  | Session
  | FileSystem.FileSystem
  | Path.Path
  | Crypto.Crypto;

export type { ManagerServices };
