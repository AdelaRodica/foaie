import { describe, expect, it } from "vitest";

import {
  catalogWorkFieldErrors,
  catalogWorkUpdateInputSchema,
} from "./catalog-work-validation";
import { parseCatalogRelationsJson } from "./catalog-entry-validation";

const workId = "11111111-1111-4111-8111-111111111111";
const firstId = "22222222-2222-4222-8222-222222222222";
const secondId = "33333333-3333-4333-8333-333333333333";

const validInput = {
  workId,
  work: {
    title: "Obra",
    originalTitle: null,
    description: null,
    originalPublicationYear: null,
    originalLanguageCode: null,
  },
  authorRelations: [],
  genreRelations: [],
  seriesRelations: [],
};

describe("catalogWorkUpdateInputSchema", () => {
  it("accepts a minimal work with empty relationship arrays", () => {
    expect(catalogWorkUpdateInputSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects an invalid work ID", () => {
    const result = catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      workId: "invalid",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(catalogWorkFieldErrors(result.error)).toHaveProperty("workId");
    }
  });

  it("rejects an empty title with a stable field error", () => {
    const result = catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      work: { ...validInput.work, title: "  " },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(catalogWorkFieldErrors(result.error)).toEqual({
        "work.title": ["Introduce un título para la obra."],
      });
    }
  });

  it("rejects duplicate authors", () => {
    const relation = { authorId: firstId, position: 1 };
    const result = catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      authorRelations: [relation, { ...relation, position: 2 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate author positions", () => {
    const result = catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      authorRelations: [
        { authorId: firstId, position: 1 },
        { authorId: secondId, position: 1 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate genres", () => {
    const relation = { genreId: firstId, isPrimary: false };
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      genreRelations: [relation, relation],
    }).success).toBe(false);
  });

  it("rejects more than one primary genre", () => {
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      genreRelations: [
        { genreId: firstId, isPrimary: true },
        { genreId: secondId, isPrimary: true },
      ],
    }).success).toBe(false);
  });

  it("rejects duplicate series", () => {
    const relation = {
      seriesId: firstId,
      position: null,
      positionLabel: null,
    };
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      seriesRelations: [relation, relation],
    }).success).toBe(false);
  });

  it("rejects non-positive series positions", () => {
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      seriesRelations: [{
        seriesId: firstId,
        position: 0,
        positionLabel: null,
      }],
    }).success).toBe(false);
  });

  it("rejects non-positive author positions", () => {
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      authorRelations: [{ authorId: firstId, position: 0 }],
    }).success).toBe(false);
  });

  it("rejects non-array relationships", () => {
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      authorRelations: {},
    }).success).toBe(false);
  });

  it("rejects malformed author relationship JSON", () => {
    expect(() => parseCatalogRelationsJson("not-json")).toThrow();
  });

  it("rejects external properties", () => {
    expect(catalogWorkUpdateInputSchema.safeParse({
      ...validInput,
      userId: firstId,
    }).success).toBe(false);
  });
});
