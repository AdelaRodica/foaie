import "server-only";

import { mapLibraryReadError } from "../errors";
import { mapLibraryItem } from "../mappers";
import type { LibraryItem } from "../types";
import { createAuthenticatedLibraryReadClient } from "./auth";

const LIBRARY_ITEM_COLUMNS = `
  id,
  created_at,
  edition:editions!user_editions_edition_id_fkey(
    id,
    format,
    cover_url,
    work:works!editions_work_id_fkey(
      id,
      title,
      work_authors(
        position,
        author:authors!work_authors_author_id_fkey(id,name)
      )
    )
  )
`;

export async function listMyLibrary(): Promise<LibraryItem[]> {
  const supabase = await createAuthenticatedLibraryReadClient();
  const { data, error } = await supabase
    .from("user_editions")
    .select(LIBRARY_ITEM_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) throw mapLibraryReadError(error, "listMyLibrary");
  return data.map(mapLibraryItem);
}

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
