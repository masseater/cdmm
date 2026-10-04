import { describe, expect, it } from "vite-plus/test";

import { initialsOf, toneOf } from "./look";

describe("initialsOf", () => {
  it.each([
    ["cmm-test-a", "CA"],
    ["cmm-test-b", "CB"],
    ["personal max", "PM"],
    ["Work", "W"],
    ["", ""],
  ])("gives %s the initials %s", (label, initials) => {
    expect(initialsOf(label)).toBe(initials);
  });
});

const PROFILES = 6;

describe("toneOf", () => {
  it("gives the first six profiles different colours", () => {
    const tones = new Set(Array.from({ length: PROFILES }, (_unused, index) => toneOf(index)));
    expect(tones.size).toBe(PROFILES);
  });
});
