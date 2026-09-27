import "server-only";

import { createReadOnlyClient, createWritableClient } from "../../supabase/server";
import { LibraryError } from "../errors";

export async function createAuthenticatedLibraryReadClient() {
  const supabase = await createReadOnlyClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new LibraryError("unauthenticated", {
      operation: "authenticateLibraryRead",
      cause: error,
    });
  }

  return supabase;
}

export async function createAuthenticatedLibraryWritableClient() {
  const supabase = await createWritableClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new LibraryError("unauthenticated", {
      operation: "authenticateLibraryWrite",
      cause: error,
    });
  }

  return supabase;
}
