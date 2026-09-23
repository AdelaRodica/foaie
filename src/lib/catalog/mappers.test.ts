import { describe, expect, it } from "vitest";

import { mapWorkDetails } from "./mappers";
import type { WorkDetailsRow } from "./mappers";

const baseRow: WorkDetailsRow = {
  id: "work-1",
  title: "Obra",
  original_title: null,
  description: null,
  original_publication_year: null,
  original_language_code: null,
  work_authors: [],
  work_genres: [],
  work_series: [],
  editions: [],
};

describe("mapWorkDetails", () => {
  it("maps snake_case and preserves nullable fields without relations", () => {
    expect(mapWorkDetails(baseRow)).toEqual({
      work: {
        id: "work-1",
        title: "Obra",
        originalTitle: null,
        description: null,
        originalPublicationYear: null,
        originalLanguageCode: null,
      },
      authors: [],
      genres: [],
      series: [],
      editions: [],
    });
  });

  it("sorts authors by position", () => {
    const result = mapWorkDetails({
      ...baseRow,
      work_authors: [
        { position: 2, author: { id: "author-2", name: "B", sort_name: null } },
        { position: 1, author: { id: "author-1", name: "A", sort_name: "A" } },
      ],
    });
    expect(result.authors.map(({ id, position }) => [id, position])).toEqual([
      ["author-1", 1],
      ["author-2", 2],
    ]);
  });

  it("sorts the primary genre first, then by name", () => {
    const result = mapWorkDetails({
      ...baseRow,
      work_genres: [
        { is_primary: false, genre: { id: "g-z", name: "Z", slug: "z" } },
        { is_primary: true, genre: { id: "g-p", name: "Principal", slug: "principal" } },
        { is_primary: false, genre: { id: "g-a", name: "A", slug: "a" } },
      ],
    });
    expect(result.genres.map(({ id }) => id)).toEqual(["g-p", "g-a", "g-z"]);
  });

  it("sorts positioned series before labelled and unpositioned series", () => {
    const result = mapWorkDetails({
      ...baseRow,
      work_series: [
        { position: null, position_label: null, series: { id: "s-z", name: "Z" } },
        { position: null, position_label: "Precuela", series: { id: "s-p", name: "P" } },
        { position: 2.5, position_label: null, series: { id: "s-2", name: "Dos" } },
        { position: 1, position_label: null, series: { id: "s-1", name: "Uno" } },
      ],
    });
    expect(result.series.map(({ id }) => id)).toEqual(["s-1", "s-2", "s-p", "s-z"]);
    expect(result.series[2].positionLabel).toBe("Precuela");
  });

  it("maps publishers and sorts editions by date with nulls last, then id", () => {
    const result = mapWorkDetails({
      ...baseRow,
      editions: [
        {
          id: "edition-z",
          edition_title: null,
          subtitle: null,
          isbn10: null,
          isbn13: null,
          publication_date: null,
          publication_date_precision: null,
          language_code: null,
          format: "EBOOK",
          page_count: null,
          audio_duration_minutes: null,
          cover_url: null,
          cover_storage_key: null,
          publisher: null,
        },
        {
          id: "edition-b",
          edition_title: "Edición",
          subtitle: "Subtítulo",
          isbn10: "0306406152",
          isbn13: "9780306406157",
          publication_date: "2020-01-01",
          publication_date_precision: "YEAR",
          language_code: "es",
          format: "PHYSICAL",
          page_count: 320,
          audio_duration_minutes: null,
          cover_url: "https://example.com/cover.jpg",
          cover_storage_key: null,
          publisher: { id: "publisher-1", name: "Editorial" },
        },
        {
          id: "edition-a",
          edition_title: null,
          subtitle: null,
          isbn10: null,
          isbn13: null,
          publication_date: "2020-01-01",
          publication_date_precision: "DAY",
          language_code: null,
          format: "AUDIOBOOK",
          page_count: null,
          audio_duration_minutes: 600,
          cover_url: null,
          cover_storage_key: "covers/a.jpg",
          publisher: null,
        },
      ],
    });

    expect(result.editions.map(({ id }) => id)).toEqual(["edition-a", "edition-b", "edition-z"]);
    expect(result.editions[1].publisher).toEqual({ id: "publisher-1", name: "Editorial" });
    expect(result.editions[0].publisher).toBeNull();
  });
});
