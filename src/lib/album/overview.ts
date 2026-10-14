import { summarizeFinishedReadings } from "../home/overview";
import type { HomeReading } from "../home/types";
import { deriveReadingActivityDates } from "../reading-goals/activity";
import { deriveAnnualReadingGoalProgress } from "../reading-goals/goal-progress";
import { deriveWeeklyReadingStreak } from "../reading-goals/streak";
import type { AnnualReadingGoal } from "../reading-goals/types";
import {
  ALBUM_PAGE_SIZE,
  type AlbumMonth,
  type AlbumPage,
  type AlbumYear,
  type ReadingSticker,
} from "./types";

type AlbumInput = Readonly<{
  year: number;
  readings: readonly HomeReading[];
  goal: AnnualReadingGoal | null;
  progressDates: readonly string[];
  readingDaysPerWeek: number;
}>;

function compareChronologically(left: ReadingSticker, right: ReadingSticker) {
  return left.finishedAt.localeCompare(right.finishedAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id);
}

export function listAlbumYears(
  readings: readonly HomeReading[],
): number[] {
  return [...new Set(readings.flatMap((reading) =>
    reading.status === "FINISHED" && reading.finishedAt
      ? [Number(reading.finishedAt.slice(0, 4))]
      : [],
  ))].sort((left, right) => right - left);
}

export function selectInitialAlbumYear(
  currentYear: number,
  availableYears: readonly number[],
) {
  return availableYears.includes(currentYear)
    ? currentYear
    : availableYears[0] ?? currentYear;
}

export function deriveAlbumYear({
  year,
  readings,
  goal,
  progressDates,
  readingDaysPerWeek,
}: AlbumInput): AlbumYear {
  if (!Number.isSafeInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("year must be a valid calendar year.");
  }

  const finished = readings
    .filter((reading): reading is HomeReading & { status: "FINISHED"; finishedAt: string } =>
      reading.status === "FINISHED" && reading.finishedAt !== null,
    )
    .sort((left, right) =>
      left.finishedAt.localeCompare(right.finishedAt) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
    );
  const seenMemberships = new Set<string>();
  const stickers = finished.map<ReadingSticker>((reading) => {
    const isReread = seenMemberships.has(reading.book.userEditionId);
    seenMemberships.add(reading.book.userEditionId);
    return { ...reading, isReread };
  });
  const yearPrefix = `${year}-`;
  const yearReadings = stickers
    .filter(({ finishedAt }) => finishedAt.startsWith(yearPrefix))
    .sort(compareChronologically);
  const months: AlbumMonth[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const prefix = `${year}-${String(month).padStart(2, "0")}-`;
    const monthReadings = yearReadings.filter(({ finishedAt }) =>
      finishedAt.startsWith(prefix),
    );
    const previousCount = month === 1
      ? null
      : yearReadings.filter(({ finishedAt }) =>
          finishedAt.startsWith(`${year}-${String(month - 1).padStart(2, "0")}-`),
        ).length;
    return {
      month,
      readings: monthReadings,
      summary: summarizeFinishedReadings(monthReadings),
      previousMonthDifference: previousCount === null
        ? null
        : monthReadings.length - previousCount,
    };
  });
  const yearFinishedDates = yearReadings.map(({ finishedAt }) => finishedAt);
  const yearProgressDates = progressDates.filter((date) => date.startsWith(yearPrefix));
  const activityDates = deriveReadingActivityDates(
    yearProgressDates,
    yearFinishedDates,
  );

  return {
    year,
    availableYears: listAlbumYears(readings),
    months,
    summary: summarizeFinishedReadings(yearReadings),
    goalProgress: goal
      ? deriveAnnualReadingGoalProgress(goal, yearReadings.length)
      : null,
    longestStreak: deriveWeeklyReadingStreak(
      activityDates,
      `${year}-12-31`,
      readingDaysPerWeek,
    ).longest,
  };
}

export function getAlbumPage(
  month: AlbumMonth,
  requestedPage: number,
): AlbumPage {
  const pageCount = Math.ceil(month.readings.length / ALBUM_PAGE_SIZE);
  if (pageCount === 0) return { page: 1, pageCount: 0, readings: [] };
  const page = Number.isSafeInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const start = (page - 1) * ALBUM_PAGE_SIZE;
  return {
    page,
    pageCount,
    readings: month.readings.slice(start, start + ALBUM_PAGE_SIZE),
  };
}
