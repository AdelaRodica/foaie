import { ReadingError } from "./errors";
import type {
  ProgressEntry,
  ProgressEntryKind,
  ReadingProgressUnit,
  ReadingSession,
  ReadingStatus,
} from "./types";

export const READING_SESSION_COLUMNS = `
  id,
  user_edition_id,
  status,
  started_at,
  finished_at,
  abandoned_at,
  current_value,
  progress_unit,
  created_at
`;

export const PROGRESS_ENTRY_COLUMNS = `
  id,
  reading_session_id,
  kind,
  previous_value,
  new_value,
  occurred_on,
  created_at
`;

export type ReadingSessionRow = Readonly<{
  id: string;
  user_edition_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  abandoned_at: string | null;
  current_value: number;
  progress_unit: string;
  created_at: string;
}>;

export type ProgressEntryRow = Readonly<{
  id: string;
  reading_session_id: string;
  kind: string;
  previous_value: number;
  new_value: number;
  occurred_on: string;
  created_at: string;
}>;

function parseReadingStatus(value: string): ReadingStatus {
  if (value === "READING" || value === "FINISHED" || value === "ABANDONED") {
    return value;
  }

  throw new ReadingError("unexpected", { operation: "mapReadingSession" });
}

function parseReadingProgressUnit(value: string): ReadingProgressUnit {
  if (value === "PAGES" || value === "PERCENT" || value === "MINUTES") {
    return value;
  }

  throw new ReadingError("unexpected", { operation: "mapReadingSession" });
}

function parseProgressEntryKind(value: string): ProgressEntryKind {
  if (value === "PROGRESS" || value === "CORRECTION") {
    return value;
  }

  throw new ReadingError("unexpected", { operation: "mapProgressEntry" });
}

export function mapReadingSession(row: ReadingSessionRow): ReadingSession {
  return {
    id: row.id,
    userEditionId: row.user_edition_id,
    status: parseReadingStatus(row.status),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    abandonedAt: row.abandoned_at,
    currentValue: row.current_value,
    progressUnit: parseReadingProgressUnit(row.progress_unit),
    createdAt: row.created_at,
  };
}

export function mapProgressEntry(row: ProgressEntryRow): ProgressEntry {
  return {
    id: row.id,
    readingSessionId: row.reading_session_id,
    kind: parseProgressEntryKind(row.kind),
    previousValue: row.previous_value,
    newValue: row.new_value,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}
