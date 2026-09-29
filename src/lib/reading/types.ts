export type ReadingErrorKind =
  | "unauthenticated"
  | "not_found"
  | "conflict"
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

export type StartReadingInput = Readonly<{
  userEditionId: string;
  startedAt: string;
  progressUnit: ReadingProgressUnit;
  currentValue?: number;
}>;
