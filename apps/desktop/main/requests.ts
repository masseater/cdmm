import { Effect, Option } from "effect";

import { handleLink } from "./links.ts";
import { handlers } from "./manager.ts";
import type { ManagerServices } from "./services.ts";
import type { StoreError } from "./store.ts";
import type { Ui } from "./ui.ts";

type LaunchRequest =
  | Readonly<{ kind: "route"; link: string }>
  | Readonly<{ kind: "launch"; accountId: string }>
  | Readonly<{ kind: "open" }>;

const NEXT = 1;
const MISSING = -1;

const argumentAfter = (
  input: Readonly<{ argv: readonly string[]; flag: string }>,
): Option.Option<string> => {
  const index = input.argv.indexOf(input.flag);
  if (index === MISSING) {
    return Option.none();
  }
  return Option.fromNullishOr(input.argv.at(index + NEXT));
};

const requestFrom = (argv: readonly string[]): LaunchRequest => {
  const link = argumentAfter({ argv, flag: "--route" });
  if (Option.isSome(link)) {
    return { kind: "route", link: link.value };
  }
  const accountId = argumentAfter({ argv, flag: "--launch" });
  if (Option.isSome(accountId)) {
    return { kind: "launch", accountId: accountId.value };
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
  if (request.kind === "launch") {
    return handlers.launchDesktop(request.accountId).pipe(Effect.asVoid);
  }
  return Effect.sync(input.ui.showWindow);
};

export type { LaunchRequest };
export { handleRequest, requestFrom };
