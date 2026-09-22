import { describe, expect, it } from "vitest";

import { CatalogError } from "./errors";
import {
  escapeIlikePattern,
  normalizeSearchQuery,
  parseSearchOptions,
} from "./search";

describe("normalizeSearchQuery", () => {
  it("trims, lowercases, and collapses whitespace", () => {
    expect(normalizeSearchQuery("  La\t CASA\n Azul  ")).toBe("la casa azul");
  });
});

describe("parseSearchOptions", () => {
  it("marks a short query as not searchable", () => {
    expect(parseSearchOptions({ query: " a " }).shouldSearch).toBe(false);
  });

  it("uses the default limit", () => {
    expect(parseSearchOptions({ query: "obra" }).limit).toBe(20);
  });

  it("clamps the limit to the maximum", () => {
    expect(parseSearchOptions({ query: "obra", limit: 100 }).limit).toBe(50);
  });

  it.each([1.5, 0, -1])("rejects invalid limit %s", (limit) => {
    expect(() => parseSearchOptions({ query: "obra", limit })).toThrow(CatalogError);
  });
});

describe("escapeIlikePattern", () => {
  it.each([
    ["100%", "100\\%"],
    ["a_b", "a\\_b"],
    ["a\\b", "a\\\\b"],
  ])("escapes %s", (input, expected) => {
    expect(escapeIlikePattern(input)).toBe(expected);
  });
});
