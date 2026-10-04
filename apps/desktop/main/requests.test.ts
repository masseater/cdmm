import { describe, expect, it } from "vite-plus/test";

import { requestFrom } from "./requests.ts";

const EXE = String.raw`C:\Programs\Claude Max Desktop Manager.exe`;
const LINK = "claude://claude.ai/new?q=1";

describe("requestFrom", () => {
  it.each([
    ["as registered", [EXE, "--route", "--", LINK]],
    [
      "reordered by Chromium for a second instance",
      [EXE, "--route", "--original-process-start-time=13404567890", "--", LINK],
    ],
    ["with the switch after the link", [EXE, LINK, "--route"]],
  ])("routes the link %s", (_case, argv) => {
    expect(requestFrom(argv)).toStrictEqual({ kind: "route", link: LINK });
  });

  it("opens the window when no route was asked for", () => {
    expect(requestFrom([EXE, LINK])).toStrictEqual({ kind: "open" });
  });

  it("opens the window when --route carries no claude link", () => {
    expect(requestFrom([EXE, "--route", "--", "https://example.com"])).toStrictEqual({
      kind: "open",
    });
  });
});
