import type { z } from "zod";

import type {
  authorInputSchema,
  editionCreateInputSchema,
  editionUpdateInputSchema,
  publisherInputSchema,
  seriesInputSchema,
  workAuthorInputSchema,
  workGenreInputSchema,
  workInputSchema,
  workSeriesInputSchema,
} from "./schemas";

export type WorkInput = z.infer<typeof workInputSchema>;
export type AuthorInput = z.infer<typeof authorInputSchema>;
export type PublisherInput = z.infer<typeof publisherInputSchema>;
export type SeriesInput = z.infer<typeof seriesInputSchema>;
export type EditionCreateInput = z.infer<typeof editionCreateInputSchema>;
export type EditionUpdateInput = z.infer<typeof editionUpdateInputSchema>;
export type WorkAuthorInput = z.infer<typeof workAuthorInputSchema>;
export type WorkGenreInput = z.infer<typeof workGenreInputSchema>;
export type WorkSeriesInput = z.infer<typeof workSeriesInputSchema>;

export type SearchOptions = Readonly<{
  query: string;
  limit?: number;
}>;

export type ParsedSearchOptions = Readonly<{
  query: string;
  limit: number;
  shouldSearch: boolean;
}>;

export type WorkSummary = Readonly<{
  id: string;
  title: string;
  originalTitle: string | null;
  originalPublicationYear: number | null;
  originalLanguageCode: string | null;
}>;

export type AuthorSummary = Readonly<{
  id: string;
  name: string;
  sortName: string | null;
}>;

export type PublisherSummary = Readonly<{
  id: string;
  name: string;
}>;

export type SeriesSummary = Readonly<{
  id: string;
  name: string;
  description: string | null;
}>;

export type GenreOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type WorkAuthorDetails = AuthorSummary & Readonly<{ position: number }>;
export type WorkGenreDetails = GenreOption & Readonly<{ isPrimary: boolean }>;
export type WorkSeriesDetails = Readonly<{
  id: string;
  name: string;
  position: number | null;
  positionLabel: string | null;
}>;

export type WorkEditionDetails = Readonly<{
  id: string;
  editionTitle: string | null;
  subtitle: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publicationDate: string | null;
  publicationDatePrecision: string | null;
  languageCode: string | null;
  format: string;
  pageCount: number | null;
  audioDurationMinutes: number | null;
  coverUrl: string | null;
  coverStorageKey: string | null;
  publisher: PublisherSummary | null;
}>;

export type WorkDetails = Readonly<{
  work: WorkSummary & Readonly<{ description: string | null }>;
  authors: WorkAuthorDetails[];
  genres: WorkGenreDetails[];
  series: WorkSeriesDetails[];
  editions: WorkEditionDetails[];
}>;

export type MutationIdResult = Readonly<{ id: string }>;

export type CatalogErrorKind =
  | "validation"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";
