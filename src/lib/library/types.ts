import type {
  CurrentReadingState,
  ReadingHistorySummary,
} from "../reading/types";

export type LibraryErrorKind =
  | "unauthenticated"
  | "not_found"
  | "protected_history"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";

export type LibraryMembership = Readonly<{
  id: string;
  editionId: string;
  addedAt: string;
}>;

export type LibraryItem = Readonly<{
  id: string;
  addedAt: string;
  currentReadingState: CurrentReadingState;
  readingHistory: ReadingHistorySummary;
  edition: Readonly<{
    id: string;
    format: string;
    coverSrc: string | null;
    work: Readonly<{
      id: string;
      title: string;
      authors: readonly string[];
    }>;
  }>;
}>;
