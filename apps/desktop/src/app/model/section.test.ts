import { describe, expect, it } from "vite-plus/test";

import { titleOf, windowModeOf } from "./section";

describe("titleOf", () => {
  it.each([
    ["picker", "Claude Max Desktop Manager"],
    ["accounts", "Profiles | Claude Max Desktop Manager"],
    ["global", "Global | Claude Max Desktop Manager"],
  ] as const)("titles %s as %s", (section, title) => {
    expect(titleOf(section)).toBe(title);
  });
});

describe("windowModeOf", () => {
  it.each([
    ["picker", "picker"],
    ["accounts", "manage"],
    ["global", "manage"],
  ] as const)("sizes %s as %s", (section, mode) => {
    expect(windowModeOf(section)).toBe(mode);
  });
});
