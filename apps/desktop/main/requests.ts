import { Effect, Option } from "effect";

import { handleLink } from "./links.ts";
import type { ManagerServices } from "./services.ts";
import type { StoreError } from "./store.ts";
import type { Ui } from "./ui.ts";

type LaunchRequest = Readonly<{ kind: "route"; link: string }> | Readonly<{ kind: "open" }>;

const ROUTE_FLAG = "--route";
const CLAUDE_LINK = /^claude:/iu;

const requestFrom = (argv: readonly string[]): LaunchRequest => {
  const link = Option.fromNullishOr(argv.find((arg) => CLAUDE_LINK.test(arg)));
  if (argv.includes(ROUTE_FLAG) && Option.isSome(link)) {
    return { kind: "route", link: link.value };
  }
  return { kind: "open" };
};

const handleRequest = (
  input: Readonly<{ request: LaunchRequest; ui: Ui }>,
): Effect.Effect<void, StoreError, ManagerServices> => {
  const { request } = input;
  if (request.kind === "route") {
    return handleLink(request.link);
  }
  return Effect.sync(input.ui.showWindow);
};

export type { LaunchRequest };
export { handleRequest, requestFrom };
