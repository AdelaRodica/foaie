import type { ReadingHistorySummary, ReadingSession } from "./types";

function emptyReadingHistorySummary(): ReadingHistorySummary {
  return {
    sessionCount: 0,
    readingCount: 0,
    finishedCount: 0,
    abandonedCount: 0,
  };
}

function addSession(
  summary: ReadingHistorySummary,
  session: ReadingSession,
): ReadingHistorySummary {
  return {
    sessionCount: summary.sessionCount + 1,
    readingCount: summary.readingCount + (session.status === "READING" ? 1 : 0),
    finishedCount: summary.finishedCount + (session.status === "FINISHED" ? 1 : 0),
    abandonedCount:
      summary.abandonedCount + (session.status === "ABANDONED" ? 1 : 0),
  };
}

export function deriveReadingHistorySummary(
  sessions: readonly ReadingSession[],
): ReadingHistorySummary {
  return sessions.reduce(addSession, emptyReadingHistorySummary());
}

export function deriveReadingHistorySummariesByUserEdition(
  userEditionIds: readonly string[],
  sessions: readonly ReadingSession[],
): ReadonlyMap<string, ReadingHistorySummary> {
  const summaries = new Map(
    userEditionIds.map((userEditionId) => [
      userEditionId,
      emptyReadingHistorySummary(),
    ]),
  );

  for (const session of sessions) {
    const summary = summaries.get(session.userEditionId);
    if (summary) {
      summaries.set(session.userEditionId, addSession(summary, session));
    }
  }

  return summaries;
}
