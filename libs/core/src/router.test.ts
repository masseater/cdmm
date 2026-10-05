import { Option } from "effect";
import { describe, expect, it } from "vite-plus/test";

import type { AccountRuntime, RouteDecision } from "./router.ts";
import { classifyLink, decideRoute } from "./router.ts";

const NOW = 1_000_000;
const LATER = NOW + NOW;
const EARLIER = NOW - NOW;
const LOGIN = "claude://login/google-auth?code=abc";
const GENERAL = "claude://claude.ai/new?q=hello";

const account = (id: string, patch: Partial<AccountRuntime> = {}): AccountRuntime => ({
  id,
  running: false,
  signedIn: true,
  pendingLoginUntil: Option.none(),
  ...patch,
});

const route = (
  spec: Readonly<{ link: string; accounts: readonly AccountRuntime[]; lastActiveId?: string }>,
): RouteDecision =>
  decideRoute({
    link: spec.link,
    state: {
      accounts: spec.accounts,
      lastActiveId: Option.fromNullishOr(spec.lastActiveId),
      now: NOW,
    },
  });

describe("classifyLink", () => {
  it.each([
    [LOGIN, "login"],
    ["claude://claude.ai/magic-link#a:b", "login"],
    ["claude://claude.ai/sso-callback?code=x", "login"],
    [GENERAL, "general"],
    ["claude://cowork/new", "general"],
    ["https://claude.ai/login", "invalid"],
    ["not a url", "invalid"],
  ])("%s is %s", (link, kind) => {
    expect(classifyLink(link)).toBe(kind);
  });
});

describe("login callbacks", () => {
  it("go to the only account waiting for a login, even if another one is signed out", () => {
    const accounts = [
      account("aa", { running: true, pendingLoginUntil: Option.some(LATER) }),
      account("bb", { running: true, signedIn: false }),
    ];
    expect(route({ link: LOGIN, accounts })).toStrictEqual({ status: "deliver", accountId: "aa" });
  });

  it("ask the user when two accounts wait for a login", () => {
    const accounts = [
      account("aa", { pendingLoginUntil: Option.some(LATER) }),
      account("bb", { pendingLoginUntil: Option.some(LATER) }),
    ];
    expect(route({ link: LOGIN, accounts })).toStrictEqual({
      status: "ask",
      candidates: ["aa", "bb"],
    });
  });

  it("ignore an expired login wait", () => {
    const accounts = [account("aa", { pendingLoginUntil: Option.some(EARLIER) }), account("bb")];
    expect(route({ link: LOGIN, accounts })).toStrictEqual({
      status: "ask",
      candidates: ["aa", "bb"],
    });
  });

  it("go to the only running account that is signed out", () => {
    const accounts = [
      account("aa", { running: true }),
      account("bb", { running: true, signedIn: false }),
    ];
    expect(route({ link: LOGIN, accounts, lastActiveId: "aa" })).toStrictEqual({
      status: "deliver",
      accountId: "bb",
    });
  });

  it("never fall back to the last active account", () => {
    const accounts = [account("aa", { running: true }), account("bb", { running: true })];
    expect(route({ link: LOGIN, accounts, lastActiveId: "aa" })).toStrictEqual({
      status: "ask",
      candidates: ["aa", "bb"],
    });
  });
});

describe("general links", () => {
  const both = [account("aa", { running: true }), account("bb", { running: true })];

  it("go to the last active running account", () => {
    expect(route({ link: GENERAL, accounts: both, lastActiveId: "bb" })).toStrictEqual({
      status: "deliver",
      accountId: "bb",
    });
  });

  it("ask when several accounts run and none was active", () => {
    expect(route({ link: GENERAL, accounts: both })).toStrictEqual({
      status: "ask",
      candidates: ["aa", "bb"],
    });
  });

  it("go to the regular Claude when no account is managed", () => {
    expect(route({ link: GENERAL, accounts: [] })).toStrictEqual({ status: "deliver-default" });
  });

  it("are rejected when they are not claude links", () => {
    expect(route({ link: "https://evil.example/", accounts: both })).toStrictEqual({
      status: "reject",
    });
  });
});
