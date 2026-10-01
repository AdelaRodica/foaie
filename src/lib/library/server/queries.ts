import "server-only";

import { deriveCurrentReadingStatesByUserEdition } from "../../reading/current-state";
import { deriveReadingHistorySummariesByUserEdition } from "../../reading/history";
import { listReadingSessionsForUserEditions } from "../../reading/server/queries";
import { LibraryError, mapLibraryReadError } from "../errors";
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
  if (data.length === 0) return [];

  const userEditionIds = data.map(({ id }) => id);
  const sessions = await listReadingSessionsForUserEditions(userEditionIds);
  const states = deriveCurrentReadingStatesByUserEdition(userEditionIds, sessions);
  const histories = deriveReadingHistorySummariesByUserEdition(
    userEditionIds,
    sessions,
  );

  return data.map((row) => {
    const currentReadingState = states.get(row.id);
    const readingHistory = histories.get(row.id);
    if (!currentReadingState || !readingHistory) {
      throw new LibraryError("unexpected", { operation: "listMyLibrary" });
    }

    return mapLibraryItem(row, currentReadingState, readingHistory);
  });
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
