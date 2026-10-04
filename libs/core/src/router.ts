import { Array as Arr, Option } from "effect";

type LinkKind = "login" | "general" | "invalid";

type AccountRuntime = Readonly<{
  id: string;
  running: boolean;
  signedIn: boolean;
  pendingLoginUntil: Option.Option<number>;
}>;

type RouteState = Readonly<{
  accounts: readonly AccountRuntime[];
  lastActiveId: Option.Option<string>;
  now: number;
}>;

type RouteDecision =
  | Readonly<{ status: "deliver"; accountId: string }>
  | Readonly<{ status: "deliver-default" }>
  | Readonly<{ status: "ask"; candidates: readonly string[] }>
  | Readonly<{ status: "reject" }>;

const LOGIN_HOST = "login";
const LOGIN_PATH = /callback|magic|auth|sso|login/iu;
const MAX_LINK_LENGTH = 32_768;
const ONE = 1;

type ClaudeLink = Readonly<{ host: string; path: string }>;

const parseLink = (raw: string): Option.Option<ClaudeLink> =>
  Option.liftPredicate(raw, (value) => value.length <= MAX_LINK_LENGTH && URL.canParse(value)).pipe(
    Option.map((value) => new URL(value)),
    Option.filter((url) => url.protocol === "claude:"),
    Option.map((url) => ({ host: url.hostname, path: url.pathname })),
  );

const kindOf = (link: ClaudeLink): LinkKind => {
  if (link.host === LOGIN_HOST || LOGIN_PATH.test(link.path)) {
    return "login";
  }
  return "general";
};

const classifyLink = (raw: string): LinkKind =>
  Option.match(parseLink(raw), { onNone: (): LinkKind => "invalid", onSome: kindOf });

const single = (ids: readonly string[]): Option.Option<string> =>
  Option.filter(Arr.head(ids), () => ids.length === ONE);

const ask = (candidates: readonly string[]): RouteDecision => ({ status: "ask", candidates });

const deliver = (accountId: string): RouteDecision => ({ status: "deliver", accountId });

const isWaitingForLogin = (account: AccountRuntime, now: number): boolean =>
  Option.exists(account.pendingLoginUntil, (until) => until > now);

const decideWithoutPending = (state: RouteState): RouteDecision => {
  const signedOut = state.accounts
    .filter((account) => account.running && !account.signedIn)
    .map((account) => account.id);
  return Option.match(single(signedOut), {
    onSome: deliver,
    onNone: () => {
      if (Arr.isReadonlyArrayNonEmpty(signedOut)) {
        return ask(signedOut);
      }
      return ask(state.accounts.map((account) => account.id));
    },
  });
};

const decideLogin = (state: RouteState): RouteDecision => {
  const pending = state.accounts
    .filter((account) => isWaitingForLogin(account, state.now))
    .map((account) => account.id);
  return Option.match(single(pending), {
    onSome: deliver,
    onNone: () => {
      if (Arr.isReadonlyArrayNonEmpty(pending)) {
        return ask(pending);
      }
      return decideWithoutPending(state);
    },
  });
};

const decideGeneral = (state: RouteState): RouteDecision => {
  const running = state.accounts.filter((account) => account.running).map((account) => account.id);
  const known = new Set(state.accounts.map((account) => account.id));
  const lastRunning = state.lastActiveId.pipe(Option.filter((id) => running.includes(id)));
  const lastKnown = state.lastActiveId.pipe(Option.filter((id) => known.has(id)));
  return Option.match(
    Option.orElse(lastRunning, () => single(running)),
    {
      onSome: deliver,
      onNone: () => {
        if (Arr.isReadonlyArrayNonEmpty(running)) {
          return ask(running);
        }
        return Option.match(lastKnown, {
          onSome: deliver,
          onNone: (): RouteDecision => ({ status: "deliver-default" }),
        });
      },
    },
  );
};

const DECIDERS: Readonly<Record<LinkKind, (state: RouteState) => RouteDecision>> = {
  invalid: () => ({ status: "reject" }),
  login: decideLogin,
  general: decideGeneral,
};

const decideRoute = (input: Readonly<{ link: string; state: RouteState }>): RouteDecision =>
  DECIDERS[classifyLink(input.link)](input.state);

export type { AccountRuntime, LinkKind, RouteDecision, RouteState };
export { classifyLink, decideRoute };
