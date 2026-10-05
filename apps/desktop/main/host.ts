import type { ApiInput } from "@cdmm/core";
import { Context } from "effect";
import type { Effect } from "effect";

import type { ManagerError } from "./errors.ts";

class Host extends Context.Service<
  Host,
  Readonly<{
    appData: string;
    encrypt: (plain: string) => Effect.Effect<string, ManagerError>;
    decrypt: (sealed: string) => Effect.Effect<string, ManagerError>;
    openPath: (path: string) => Effect.Effect<void, ManagerError>;
    openExternal: (url: string) => Effect.Effect<void, ManagerError>;
    choicesChanged: Effect.Effect<void>;
    fitWindow: (mode: ApiInput<"fitWindow">) => Effect.Effect<void>;
  }>
>()("@cdmm/desktop/main/host") {}

export { Host };
