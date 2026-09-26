import "server-only";

import { z } from "zod";

import { CatalogError, catalogValidationError } from "../errors";
import {
  mapAuthorSummary,
  mapEditionSearchResult,
  mapPublisherSummary,
  mapSeriesSummary,
  mapWorkCapabilities,
  mapWorkDetails,
  mapWorkSummary,
  normalizeIsbnSearch,
} from "../mappers";
import { escapeIlikePattern, parseSearchOptions } from "../search";
import type {
  AuthorSummary,
  EditionSearchResult,
  GenreOption,
  PublisherSummary,
  SearchOptions,
  SeriesSummary,
  WorkDetails,
  WorkDetailsForViewer,
  WorkSummary,
} from "../types";
import {
  createAuthenticatedCatalogClient,
  createAuthenticatedCatalogReadContext,
} from "./auth";
import { mapCatalogReadError } from "./errors";

const uuidSchema = z.string().uuid();

const WORK_SUMMARY_COLUMNS =
  "id,title,original_title,original_publication_year,original_language_code";
const AUTHOR_SUMMARY_COLUMNS = "id,name,sort_name";
const PUBLISHER_SUMMARY_COLUMNS = "id,name";
const SERIES_SUMMARY_COLUMNS = "id,name,description";
const GENRE_COLUMNS = "id,name,slug";
const EDITION_SEARCH_COLUMNS =
  "id,work_id,format,isbn10,isbn13,cover_url,work:works(id,title),publisher:publishers(id,name)";

const WORK_DETAILS_COLUMNS = `
  id,
  title,
  original_title,
  description,
  original_publication_year,
  original_language_code,
  work_authors(position,author:authors(id,name,sort_name)),
  work_genres(is_primary,genre:genres(id,name,slug)),
  work_series(position,position_label,series:series(id,name)),
  editions(
    id,
    edition_title,
    subtitle,
    isbn10,
    isbn13,
    publication_date,
    publication_date_precision,
    language_code,
    format,
    page_count,
    audio_duration_minutes,
    cover_url,
    cover_storage_key,
    publisher:publishers(id,name)
  )
`;

const WORK_DETAILS_FOR_VIEWER_COLUMNS = `
  id,
  title,
  original_title,
  description,
  original_publication_year,
  original_language_code,
  created_by_profile_id,
  work_authors(position,author:authors(id,name,sort_name)),
  work_genres(is_primary,genre:genres(id,name,slug)),
  work_series(position,position_label,series:series(id,name)),
  editions(
    id,
    edition_title,
    subtitle,
    isbn10,
    isbn13,
    publication_date,
    publication_date_precision,
    language_code,
    format,
    page_count,
    audio_duration_minutes,
    cover_url,
    cover_storage_key,
    created_by_profile_id,
    publisher:publishers(id,name)
  )
`;

function parseId(value: string, operation: string) {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw catalogValidationError(result.error, operation);
  return result.data;
}

export async function searchWorks(options: SearchOptions): Promise<WorkSummary[]> {
  const parsed = parseSearchOptions(options);
  if (!parsed.shouldSearch) return [];
  const supabase = await createAuthenticatedCatalogClient();
  const pattern = `%${escapeIlikePattern(parsed.query)}%`;
  const { data, error } = await supabase
    .from("works")
    .select(WORK_SUMMARY_COLUMNS)
    .ilike("normalized_title", pattern)
    .order("normalized_title", { ascending: true })
    .order("id", { ascending: true })
    .limit(parsed.limit);

  if (error) throw mapCatalogReadError(error, "searchWorks");
  return data.map(mapWorkSummary);
}

export async function searchAuthors(options: SearchOptions): Promise<AuthorSummary[]> {
  const parsed = parseSearchOptions(options);
  if (!parsed.shouldSearch) return [];
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("authors")
    .select(AUTHOR_SUMMARY_COLUMNS)
    .ilike("normalized_name", `%${escapeIlikePattern(parsed.query)}%`)
    .order("normalized_name", { ascending: true })
    .order("id", { ascending: true })
    .limit(parsed.limit);

  if (error) throw mapCatalogReadError(error, "searchAuthors");
  return data.map(mapAuthorSummary);
}

export async function searchPublishers(options: SearchOptions): Promise<PublisherSummary[]> {
  const parsed = parseSearchOptions(options);
  if (!parsed.shouldSearch) return [];
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("publishers")
    .select(PUBLISHER_SUMMARY_COLUMNS)
    .ilike("normalized_name", `%${escapeIlikePattern(parsed.query)}%`)
    .order("normalized_name", { ascending: true })
    .order("id", { ascending: true })
    .limit(parsed.limit);

  if (error) throw mapCatalogReadError(error, "searchPublishers");
  return data.map(mapPublisherSummary);
}

export async function searchSeries(options: SearchOptions): Promise<SeriesSummary[]> {
  const parsed = parseSearchOptions(options);
  if (!parsed.shouldSearch) return [];
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("series")
    .select(SERIES_SUMMARY_COLUMNS)
    .ilike("normalized_name", `%${escapeIlikePattern(parsed.query)}%`)
    .order("normalized_name", { ascending: true })
    .order("id", { ascending: true })
    .limit(parsed.limit);

  if (error) throw mapCatalogReadError(error, "searchSeries");
  return data.map(mapSeriesSummary);
}

export async function getWorkById(workId: string): Promise<WorkSummary> {
  const validId = parseId(workId, "getWorkById");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("works")
    .select(WORK_SUMMARY_COLUMNS)
    .eq("id", validId)
    .maybeSingle();

  if (error) throw mapCatalogReadError(error, "getWorkById");
  if (!data) throw new CatalogError("not_found", { operation: "getWorkById" });
  return mapWorkSummary(data);
}

export async function getEditionWorkId(editionId: string): Promise<string> {
  const validId = parseId(editionId, "getEditionWorkId");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("editions")
    .select("id,work_id")
    .eq("id", validId)
    .maybeSingle();

  if (error) throw mapCatalogReadError(error, "getEditionWorkId");
  if (!data) {
    throw new CatalogError("not_found", { operation: "getEditionWorkId" });
  }
  return data.work_id;
}

export async function getAuthorById(authorId: string): Promise<AuthorSummary> {
  const validId = parseId(authorId, "getAuthorById");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase.from("authors").select(AUTHOR_SUMMARY_COLUMNS).eq("id", validId).maybeSingle();
  if (error) throw mapCatalogReadError(error, "getAuthorById");
  if (!data) throw new CatalogError("not_found", { operation: "getAuthorById" });
  return mapAuthorSummary(data);
}

export async function getPublisherById(publisherId: string): Promise<PublisherSummary> {
  const validId = parseId(publisherId, "getPublisherById");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase.from("publishers").select(PUBLISHER_SUMMARY_COLUMNS).eq("id", validId).maybeSingle();
  if (error) throw mapCatalogReadError(error, "getPublisherById");
  if (!data) throw new CatalogError("not_found", { operation: "getPublisherById" });
  return mapPublisherSummary(data);
}

export async function getSeriesById(seriesId: string): Promise<SeriesSummary> {
  const validId = parseId(seriesId, "getSeriesById");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase.from("series").select(SERIES_SUMMARY_COLUMNS).eq("id", validId).maybeSingle();
  if (error) throw mapCatalogReadError(error, "getSeriesById");
  if (!data) throw new CatalogError("not_found", { operation: "getSeriesById" });
  return mapSeriesSummary(data);
}

export async function listGenres(): Promise<GenreOption[]> {
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("genres")
    .select(GENRE_COLUMNS)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw mapCatalogReadError(error, "listGenres");
  return data;
}

export async function getWorkDetails(workId: string): Promise<WorkDetails> {
  const validId = parseId(workId, "getWorkDetails");
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("works")
    .select(WORK_DETAILS_COLUMNS)
    .eq("id", validId)
    .maybeSingle();

  if (error) throw mapCatalogReadError(error, "getWorkDetails");
  if (!data) throw new CatalogError("not_found", { operation: "getWorkDetails" });
  return mapWorkDetails(data);
}

export async function getWorkDetailsForViewer(
  workId: string,
): Promise<WorkDetailsForViewer> {
  const validId = parseId(workId, "getWorkDetailsForViewer");
  const { supabase, userId } = await createAuthenticatedCatalogReadContext();
  const { data, error } = await supabase
    .from("works")
    .select(WORK_DETAILS_FOR_VIEWER_COLUMNS)
    .eq("id", validId)
    .maybeSingle();

  if (error) throw mapCatalogReadError(error, "getWorkDetailsForViewer");
  if (!data) {
    throw new CatalogError("not_found", {
      operation: "getWorkDetailsForViewer",
    });
  }

  return {
    details: mapWorkDetails(data),
    capabilities: mapWorkCapabilities({
      currentUserId: userId,
      workCreatorId: data.created_by_profile_id,
      editions: data.editions.map((edition) => ({
        id: edition.id,
        creatorId: edition.created_by_profile_id,
      })),
    }),
  };
}

export async function findEditionByIsbn(query: string): Promise<EditionSearchResult | null> {
  const isbn = normalizeIsbnSearch(query);
  if (!isbn) return null;

  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("editions")
    .select(EDITION_SEARCH_COLUMNS)
    .eq(isbn.field, isbn.value)
    .maybeSingle();

  if (error) throw mapCatalogReadError(error, "findEditionByIsbn");
  return data ? mapEditionSearchResult(data) : null;
}

export async function getWorksByAuthorId(
  authorId: string,
  limit = 50,
): Promise<WorkSummary[]> {
  const validId = parseId(authorId, "getWorksByAuthorId");
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const supabase = await createAuthenticatedCatalogClient();
  const { data, error } = await supabase
    .from("work_authors")
    .select(`work:works(${WORK_SUMMARY_COLUMNS})`)
    .eq("author_id", validId)
    .order("work_id", { ascending: true })
    .limit(safeLimit);

  if (error) throw mapCatalogReadError(error, "getWorksByAuthorId");
  return data
    .map(({ work }) => mapWorkSummary(work))
    .sort((left, right) =>
      left.title.localeCompare(right.title, "es", { sensitivity: "base" }) ||
      left.id.localeCompare(right.id),
    );
}
