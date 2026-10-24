import { describe, expect, it } from "vitest";
import { matchesQuery, normalize } from "./search";

describe("patient search", () => {
  const fields = ["Ibu D", 38, "HR+/HER2-", "IV (kambuh)", "tamoksifen adjuvan; letrozol + ribociclib"];

  it("empty query matches everything", () => {
    expect(matchesQuery("", fields)).toBe(true);
    expect(matchesQuery("   ", fields)).toBe(true);
  });

  it("matches case-insensitively across fields, every word must be present", () => {
    expect(matchesQuery("ibu d", fields)).toBe(true);
    expect(matchesQuery("KAMBUH letrozol", fields)).toBe(true);
    expect(matchesQuery("ribociclib paklitaksel", fields)).toBe(false);
    expect(matchesQuery("38", fields)).toBe(true);
  });

  it("normalises accents and spacing", () => {
    expect(normalize("  Ibu   É ")).toBe("ibu e");
  });
});
