import "server-only";

import { createReadOnlyClient, createWritableClient } from "../../supabase/server";
import { ReadingError } from "../errors";

export async function createAuthenticatedReadingReadClient() {
  const supabase = await createReadOnlyClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new ReadingError("unauthenticated", {
      operation: "authenticateReadingRead",
      cause: error,
    });
  }

  return supabase;
}

export async function createAuthenticatedReadingWritableClient() {
  const supabase = await createWritableClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    throw new ReadingError("unauthenticated", {
      operation: "authenticateReadingWrite",
      cause: error,
    });
  }

  return supabase;
}
