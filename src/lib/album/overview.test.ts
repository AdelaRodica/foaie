import { describe, expect, it } from "vitest";

import type { HomeReading } from "../home/types";
import { deriveAlbumYear, getAlbumPage, listAlbumYears, selectInitialAlbumYear } from "./overview";
import { ALBUM_PAGE_SIZE } from "./types";

function finished(id: string, date: string, membership = id, createdAt = `${date}T10:00:00Z`): HomeReading {
  return {
    id,
    status: "FINISHED",
    startedAt: null,
    finishedAt: date,
    currentValue: 100,
    progressUnit: "PERCENT",
    createdAt,
    book: {
      userEditionId: membership,
      workId: `work-${membership}`,
      title: `Libro ${id}`,
      authors: [],
      format: "PHYSICAL",
      coverSrc: null,
      pageCount: 100,
      audioDurationMinutes: null,
    },
  };
}

describe("album overview", () => {
  it("selects the current year when populated and otherwise the latest year", () => {
    const readings = [finished("a", "2024-01-01"), finished("b", "2026-01-01")];
    expect(listAlbumYears(readings)).toEqual([2026, 2024]);
    expect(selectInitialAlbumYear(2026, [2026, 2024])).toBe(2026);
    expect(selectInitialAlbumYear(2027, [2026, 2024])).toBe(2026);
    expect(selectInitialAlbumYear(2027, [])).toBe(2027);
  });

  it("groups months, summarizes the year and preserves empty months", () => {
    const album = deriveAlbumYear({
      year: 2026,
      readings: [finished("jan", "2026-01-02"), finished("mar", "2026-03-02")],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    });
    expect(album.months).toHaveLength(12);
    expect(album.months[0].summary.finishedCount).toBe(1);
    expect(album.months[1].readings).toEqual([]);
    expect(album.months[2].previousMonthDifference).toBe(1);
    expect(album.summary).toMatchObject({ finishedCount: 2, pageCount: 200 });
  });

  it("orders ties by finished_at, created_at and id ascending", () => {
    const album = deriveAlbumYear({
      year: 2026,
      readings: [
        finished("c", "2026-04-02", "c", "2026-04-01T10:00:00Z"),
        finished("b", "2026-04-01", "b", "2026-04-01T11:00:00Z"),
        finished("a", "2026-04-01", "a", "2026-04-01T11:00:00Z"),
      ],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    });
    expect(album.months[3].readings.map(({ id }) => id)).toEqual(["a", "b", "c"]);
  });

  it("keeps same-edition sessions and marks only later readings as rereads", () => {
    const album = deriveAlbumYear({
      year: 2026,
      readings: [
        finished("first", "2025-06-01", "same"),
        finished("second", "2026-02-01", "same"),
        finished("third", "2026-09-01", "same"),
      ],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    });
    expect(album.months[1].readings[0].isReread).toBe(true);
    expect(album.months[8].readings[0].isReread).toBe(true);
    expect(album.summary.finishedCount).toBe(2);
  });

  it("paginates with a stable size and clamps invalid boundaries", () => {
    const album = deriveAlbumYear({
      year: 2026,
      readings: Array.from({ length: ALBUM_PAGE_SIZE + 2 }, (_, index) =>
        finished(String(index).padStart(2, "0"), "2026-05-01", `m-${index}`),
      ),
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    });
    const month = album.months[4];
    expect(getAlbumPage(month, 1).readings).toHaveLength(ALBUM_PAGE_SIZE);
    expect(getAlbumPage(month, 2).readings).toHaveLength(2);
    expect(getAlbumPage(month, 0).page).toBe(1);
    expect(getAlbumPage(month, 99).page).toBe(2);
    expect(getAlbumPage(month, Number.NaN).page).toBe(1);
    expect(getAlbumPage(album.months[0], 4)).toEqual({ page: 1, pageCount: 0, readings: [] });
  });
});
