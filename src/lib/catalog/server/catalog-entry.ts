import "server-only";

import { CatalogError } from "../errors";
import type {
  EditionCreateInput,
  WorkAuthorInput,
  WorkGenreInput,
  WorkInput,
  WorkSeriesInput,
} from "../types";
import { createAuthenticatedWritableCatalogClient } from "./auth";
import { mapCatalogMutationError } from "./errors";

export type CatalogEntryInput = Readonly<{
  work: WorkInput;
  authorRelations: Array<Omit<WorkAuthorInput, "workId">>;
  genreRelations: Array<Omit<WorkGenreInput, "workId">>;
  seriesRelations: Array<Omit<WorkSeriesInput, "workId">>;
  edition: Omit<EditionCreateInput, "workId">;
}>;

export type CatalogEntryResult = Readonly<{
  workId: string;
  editionId: string;
}>;

const nullable = <Value>(value: Value | null | undefined): Value | null =>
  value ?? null;

export async function createCatalogEntry(
  input: CatalogEntryInput,
): Promise<CatalogEntryResult> {
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.rpc("create_catalog_entry", {
    p_work: {
      title: input.work.title,
      original_title: nullable(input.work.originalTitle),
      description: nullable(input.work.description),
      original_publication_year: nullable(input.work.originalPublicationYear),
      original_language_code: nullable(input.work.originalLanguageCode),
    },
    p_author_relations: input.authorRelations.map((relation) => ({
      author_id: relation.authorId,
      position: relation.position,
    })),
    p_genre_relations: input.genreRelations.map((relation) => ({
      genre_id: relation.genreId,
      is_primary: relation.isPrimary,
    })),
    p_series_relations: input.seriesRelations.map((relation) => ({
      series_id: relation.seriesId,
      position: nullable(relation.position),
      position_label: nullable(relation.positionLabel),
    })),
    p_edition: {
      publisher_id: nullable(input.edition.publisherId),
      edition_title: nullable(input.edition.editionTitle),
      subtitle: nullable(input.edition.subtitle),
      isbn10: nullable(input.edition.isbn10),
      isbn13: nullable(input.edition.isbn13),
      publication_date: nullable(input.edition.publicationDate),
      publication_date_precision: nullable(input.edition.publicationDatePrecision),
      language_code: nullable(input.edition.languageCode),
      format: input.edition.format,
      page_count: nullable(input.edition.pageCount),
      audio_duration_minutes: nullable(input.edition.audioDurationMinutes),
      cover_url: nullable(input.edition.coverUrl),
      cover_storage_key: nullable(input.edition.coverStorageKey),
    },
  });

  if (error) throw mapCatalogMutationError(error, "createCatalogEntry");
  if (!data || data.length !== 1) {
    throw new CatalogError("unexpected", { operation: "createCatalogEntry" });
  }

  return {
    workId: data[0].work_id,
    editionId: data[0].edition_id,
  };
}
