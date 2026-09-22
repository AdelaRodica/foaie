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

export type CatalogErrorKind =
  | "validation"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";
