import type { ReadingGoalsOverview } from "../reading-goals/overview";
import type { ReadingProgressUnit } from "../reading/types";

export type HomeBook = Readonly<{
  userEditionId: string;
  workId: string;
  title: string;
  authors: readonly string[];
  format: string;
  coverSrc: string | null;
  pageCount: number | null;
  audioDurationMinutes: number | null;
}>;

export type HomeReading = Readonly<{
  id: string;
  status: "READING" | "FINISHED";
  startedAt: string | null;
  finishedAt: string | null;
  currentValue: number;
  progressUnit: ReadingProgressUnit;
  createdAt: string;
  book: HomeBook;
}>;

export type HomePeriodSummary = Readonly<{
  finishedCount: number;
  pageCount: number;
  audioMinutes: number;
  readingsWithoutPages: number;
  readingsWithoutAudioDuration: number;
}>;

export type HomeOverview = Readonly<{
  displayName: string | null;
  currentDate: string;
  year: number;
  month: number;
  hasLibrary: boolean;
  activeReadings: readonly HomeReading[];
  recentFinished: readonly HomeReading[];
  monthSummary: HomePeriodSummary;
  yearSummary: HomePeriodSummary;
  monthlyFinishedCounts: readonly number[];
  readingGoals: ReadingGoalsOverview;
}>;
