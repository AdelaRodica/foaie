import "server-only";

import { mapLibraryReadError } from "../errors";
import { createAuthenticatedLibraryReadClient } from "./auth";

export async function getMyLibraryMemberships(
  editionIds: readonly string[],
): Promise<Set<string>> {
  const uniqueEditionIds = [...new Set(editionIds)];
  if (uniqueEditionIds.length === 0) return new Set();

  const supabase = await createAuthenticatedLibraryReadClient();
  const { data, error } = await supabase
    .from("user_editions")
    .select("edition_id")
    .in("edition_id", uniqueEditionIds);

  if (error) throw mapLibraryReadError(error, "getMyLibraryMemberships");
  return new Set(data.map(({ edition_id }) => edition_id));
}
