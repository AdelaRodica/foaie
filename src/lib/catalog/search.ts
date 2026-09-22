import { z } from "zod";

import { catalogValidationError } from "./errors";
import type { ParsedSearchOptions, SearchOptions } from "./types";

export const MINIMUM_SEARCH_LENGTH = 2;
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAXIMUM_SEARCH_LIMIT = 50;

export function normalizeSearchQuery(query: string) {
  return query.replace(/\s+/gu, " ").trim().toLowerCase();
}

export function escapeIlikePattern(query: string) {
  return query.replace(/[\\%_]/g, "\\$&");
}

const searchOptionsSchema = z.object({
  query: z.string(),
  limit: z.number().int().min(1).optional(),
});

export function parseSearchOptions(options: SearchOptions): ParsedSearchOptions {
  const parsed = searchOptionsSchema.safeParse(options);

  if (!parsed.success) {
    throw catalogValidationError(parsed.error, "parseSearchOptions");
  }

  const query = normalizeSearchQuery(parsed.data.query);

  return {
    query,
    limit: Math.min(parsed.data.limit ?? DEFAULT_SEARCH_LIMIT, MAXIMUM_SEARCH_LIMIT),
    shouldSearch: query.length >= MINIMUM_SEARCH_LENGTH,
  };
}
