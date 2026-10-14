import { deriveReadingGoalsOverview } from "../reading-goals/overview";
import type { AnnualReadingGoal } from "../reading-goals/types";
import { isValidCivilDate } from "../reading/validation";
import type {
  HomeOverview,
  HomePeriodSummary,
  HomeReading,
} from "./types";

type HomeOverviewInput = Readonly<{
  displayName: string | null;
  currentDate: string;
  hasLibrary: boolean;
  readings: readonly HomeReading[];
  goal: AnnualReadingGoal | null;
  progressDates: readonly string[];
  readingDaysPerWeek: number;
}>;

export function summarizeFinishedReadings(
  readings: readonly HomeReading[],
): HomePeriodSummary {
  return readings.reduce<HomePeriodSummary>((summary, reading) => {
    const isAudio = reading.book.format === "AUDIOBOOK";
    const pageCount = isAudio ? null : reading.book.pageCount;
    const audioMinutes = isAudio ? reading.book.audioDurationMinutes : null;

    return {
      finishedCount: summary.finishedCount + 1,
      pageCount: summary.pageCount + (pageCount ?? 0),
      audioMinutes: summary.audioMinutes + (audioMinutes ?? 0),
      readingsWithoutPages:
        summary.readingsWithoutPages + (!isAudio && pageCount === null ? 1 : 0),
      readingsWithoutAudioDuration:
        summary.readingsWithoutAudioDuration +
        (isAudio && audioMinutes === null ? 1 : 0),
    };
  }, {
    finishedCount: 0,
    pageCount: 0,
    audioMinutes: 0,
    readingsWithoutPages: 0,
    readingsWithoutAudioDuration: 0,
  });
}

export function deriveHomeOverview({
  displayName,
  currentDate,
  hasLibrary,
  readings,
  goal,
  progressDates,
  readingDaysPerWeek,
}: HomeOverviewInput): HomeOverview {
  if (!isValidCivilDate(currentDate)) {
    throw new RangeError("currentDate must be a valid civil date.");
  }

  const year = Number(currentDate.slice(0, 4));
  const month = Number(currentDate.slice(5, 7));
  const yearPrefix = `${year}-`;
  const monthPrefix = `${currentDate.slice(0, 7)}-`;
  const finished = readings.filter(
    (reading): reading is HomeReading & { status: "FINISHED"; finishedAt: string } =>
      reading.status === "FINISHED" && reading.finishedAt !== null,
  );
  const finishedDates = finished.map(({ finishedAt }) => finishedAt);
  const yearFinished = finished.filter(({ finishedAt }) =>
    finishedAt.startsWith(yearPrefix),
  );
  const monthFinished = yearFinished.filter(({ finishedAt }) =>
    finishedAt.startsWith(monthPrefix),
  );
  const monthlyFinishedCounts = Array.from({ length: 12 }, () => 0);

  for (const { finishedAt } of yearFinished) {
    const finishedMonth = Number(finishedAt.slice(5, 7));
    if (finishedMonth >= 1 && finishedMonth <= 12) {
      monthlyFinishedCounts[finishedMonth - 1] += 1;
    }
  }

  const activeReadings = readings
    .filter((reading) => reading.status === "READING")
    .sort((left, right) =>
      (right.startedAt ?? right.createdAt).localeCompare(
        left.startedAt ?? left.createdAt,
      ) || right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
    );
  const recentFinished = [...finished]
    .sort((left, right) =>
      right.finishedAt.localeCompare(left.finishedAt) ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.id.localeCompare(left.id),
    )
    .slice(0, 4);

  return {
    displayName,
    currentDate,
    year,
    month,
    hasLibrary,
    activeReadings,
    recentFinished,
    monthSummary: summarizeFinishedReadings(monthFinished),
    yearSummary: summarizeFinishedReadings(yearFinished),
    monthlyFinishedCounts,
    readingGoals: deriveReadingGoalsOverview({
      currentDate,
      goal,
      finishedDates,
      progressDates,
      readingDaysPerWeek,
    }),
  };
}
