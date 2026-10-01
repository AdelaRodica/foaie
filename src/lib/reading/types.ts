export type ReadingErrorKind =
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "invalid_transition"
  | "permission"
  | "constraint"
  | "unexpected";

export type ReadingStatus =
  | "READING"
  | "FINISHED"
  | "ABANDONED";

export type ReadingProgressUnit =
  | "PAGES"
  | "PERCENT"
  | "MINUTES";

export type ProgressEntryKind =
  | "PROGRESS"
  | "CORRECTION";

export type ReadingSession = Readonly<{
  id: string;
  userEditionId: string;
  status: ReadingStatus;
  startedAt: string | null;
  finishedAt: string | null;
  abandonedAt: string | null;
  currentValue: number;
  progressUnit: ReadingProgressUnit;
  createdAt: string;
}>;

export type CurrentReadingState =
  | Readonly<{
      kind: "PENDING";
      session: null;
    }>
  | Readonly<{
      kind: "READING";
      session: ReadingSession & { status: "READING" };
    }>
  | Readonly<{
      kind: "FINISHED";
      session: ReadingSession & { status: "FINISHED" };
    }>
  | Readonly<{
      kind: "ABANDONED";
      session: ReadingSession & { status: "ABANDONED" };
    }>;

export type ReadingHistorySummary = Readonly<{
  sessionCount: number;
  readingCount: number;
  finishedCount: number;
  abandonedCount: number;
}>;

export type ProgressEntry = Readonly<{
  id: string;
  readingSessionId: string;
  kind: ProgressEntryKind;
  previousValue: number;
  newValue: number;
  occurredOn: string;
  createdAt: string;
}>;

export type StartReadingInput = Readonly<{
  userEditionId: string;
  startedAt: string;
  progressUnit: ReadingProgressUnit;
  currentValue?: number;
}>;

export type RecordReadingProgressInput = Readonly<{
  readingSessionId: string;
  targetValue: number;
  kind: ProgressEntryKind;
  occurredOn: string;
}>;

export type FinishReadingResult = Readonly<{
  outcome: "finished" | "already_finished";
  session: ReadingSession;
}>;

export type AbandonReadingResult = Readonly<{
  outcome: "abandoned" | "already_abandoned";
  session: ReadingSession;
}>;
