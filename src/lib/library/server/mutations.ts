import "server-only";

import {
  mapLibraryMutationError,
  mapLibraryReadError,
} from "../errors";
import { resolveLibraryRemovalFallback } from "../removal";
import type { LibraryMembership } from "../types";
import { createAuthenticatedLibraryWritableClient } from "./auth";

export async function addEditionToLibrary(
  editionId: string,
): Promise<LibraryMembership> {
  const supabase = await createAuthenticatedLibraryWritableClient();
  const { data, error } = await supabase
    .from("user_editions")
    .insert({ edition_id: editionId })
    .select("id, edition_id, created_at")
    .single();

  if (error) throw mapLibraryMutationError(error, "addEditionToLibrary");

  return {
    id: data.id,
    editionId: data.edition_id,
    addedAt: data.created_at,
  };
}

export async function removeEditionFromLibrary(editionId: string): Promise<void> {
  const supabase = await createAuthenticatedLibraryWritableClient();
  const { data, error } = await supabase
    .from("user_editions")
    .delete()
    .eq("edition_id", editionId)
    .select("id")
    .maybeSingle();

  if (error) throw mapLibraryMutationError(error, "removeEditionFromLibrary");
  if (data) return;

  const existence = await supabase
    .from("user_editions")
    .select("id")
    .eq("edition_id", editionId)
    .maybeSingle();

  if (existence.error) {
    throw mapLibraryReadError(
      existence.error,
      "removeEditionFromLibrary.exists",
    );
  }

  return resolveLibraryRemovalFallback(existence.data);
}
