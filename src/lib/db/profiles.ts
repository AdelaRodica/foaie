import {
  createReadOnlyClient,
  createWritableClient,
} from "@/lib/supabase/server";

export type CurrentUserProfile = Readonly<{
  displayName: string | null;
  timezone: string;
}>;

type ProfileUpdate = Readonly<{
  displayName: string | null;
  timezone: string;
}>;

const profileError = new Error("No se ha podido completar la operación con el perfil.");

export async function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  const supabase = await createReadOnlyClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  const userId = identity?.claims?.sub;

  if (identityError || !userId) {
    throw profileError;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw profileError;
  }

  return {
    displayName: data.display_name,
    timezone: data.timezone,
  };
}

export async function updateCurrentUserProfile({
  displayName,
  timezone,
}: ProfileUpdate): Promise<void> {
  const supabase = await createWritableClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  const userId = identity?.claims?.sub;

  if (identityError || !userId) {
    throw profileError;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, timezone })
    .eq("id", userId);

  if (error) {
    throw profileError;
  }
}
