import "server-only";

import {
  LibraryError,
  mapLibraryMutationError,
} from "../errors";
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
  if (!data) {
    throw new LibraryError("not_found", {
      operation: "removeEditionFromLibrary",
    });
  }
}
