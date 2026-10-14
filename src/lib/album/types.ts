import type { HomePeriodSummary, HomeReading } from "../home/types";
import type { ProgressEntry } from "../reading/types";
import type { AnnualReadingGoalProgress } from "../reading-goals/types";

export const ALBUM_PAGE_SIZE = 8;

export type ReadingSticker = HomeReading & Readonly<{
  status: "FINISHED";
  finishedAt: string;
  isReread: boolean;
}>;

export type AlbumMonth = Readonly<{
  month: number;
  readings: readonly ReadingSticker[];
  summary: HomePeriodSummary;
  previousMonthDifference: number | null;
}>;

export type AlbumYear = Readonly<{
  year: number;
  availableYears: readonly number[];
  months: readonly AlbumMonth[];
  summary: HomePeriodSummary;
  goalProgress: AnnualReadingGoalProgress | null;
  longestStreak: number;
}>;

export type AlbumPage = Readonly<{
  page: number;
  pageCount: number;
  readings: readonly ReadingSticker[];
}>;

export type AlbumSessionDetail = Readonly<{
  reading: ReadingSticker;
  progressEntries: readonly ProgressEntry[];
}>;
