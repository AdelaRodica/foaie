import "server-only";

import { z } from "zod";

import { CatalogError, catalogValidationError } from "../errors";
import {
  mapAuthorSummary,
  mapPublisherSummary,
  mapSeriesSummary,
  mapWorkDetails,
  mapWorkSummary,
} from "../mappers";
import { escapeIlikePattern, parseSearchOptions } from "../search";
import type {
  AuthorSummary,
  GenreOption,
  PublisherSummary,
  SearchOptions,
  SeriesSummary,
  WorkDetails,
  WorkSummary,
} from "../types";
import { createAuthenticatedCatalogClient } from "./auth";
import { mapCatalogReadError } from "./errors";

const uuidSchema = z.string().uuid();

const WORK_SUMMARY_COLUMNS =
  "id,title,original_title,original_publication_year,original_language_code";
const AUTHOR_SUMMARY_COLUMNS = "id,name,sort_name";
const PUBLISHER_SUMMARY_COLUMNS = "id,name";
const SERIES_SUMMARY_COLUMNS = "id,name,description";
const GENRE_COLUMNS = "id,name,slug";

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
