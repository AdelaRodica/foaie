import "server-only";

import { CatalogError } from "../errors";
import type {
  WorkAuthorInput,
  WorkGenreInput,
  WorkInput,
  WorkSeriesInput,
} from "../types";
import { createAuthenticatedWritableCatalogClient } from "./auth";
import { mapCatalogMutationError, mapCatalogReadError } from "./errors";

export type CatalogWorkUpdateInput = Readonly<{
  workId: string;
  work: WorkInput;
  authorRelations: Array<Omit<WorkAuthorInput, "workId">>;
  genreRelations: Array<Omit<WorkGenreInput, "workId">>;
  seriesRelations: Array<Omit<WorkSeriesInput, "workId">>;
}>;

export type CatalogWorkUpdateResult = Readonly<{
  workId: string;
}>;

const nullable = <Value>(value: Value | null | undefined): Value | null =>
  value ?? null;

export async function updateCatalogWork(
  input: CatalogWorkUpdateInput,
): Promise<CatalogWorkUpdateResult> {
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.rpc("update_catalog_work", {
    p_work_id: input.workId,
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
  });

  if (error) throw mapCatalogMutationError(error, "updateCatalogWork");
  if (!data) {
    throw new CatalogError("unexpected", { operation: "updateCatalogWork" });
  }
  if (data.length > 1) {
    throw new CatalogError("unexpected", { operation: "updateCatalogWork" });
  }
  if (data.length === 1) {
    return { workId: data[0].work_id };
  }

  const existence = await supabase
    .from("works")
    .select("id")
    .eq("id", input.workId)
    .maybeSingle();

  if (existence.error) {
    throw mapCatalogReadError(existence.error, "updateCatalogWork.exists");
  }

  throw new CatalogError(existence.data ? "permission" : "not_found", {
    operation: "updateCatalogWork",
  });
}
