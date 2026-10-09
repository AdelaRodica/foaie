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

export type ProfileMutationErrorKind =
  | "unauthenticated"
  | "not_found"
  | "permission"
  | "constraint"
  | "unexpected";

export class ProfileMutationError extends Error {
  readonly kind: ProfileMutationErrorKind;

  constructor(kind: ProfileMutationErrorKind, options: ErrorOptions = {}) {
    super("No se ha podido completar la operación con el perfil.", options);
    this.name = "ProfileMutationError";
    this.kind = kind;
  }
}

function mapProfileMutationError(error: { code: string }): ProfileMutationError {
  const kind: ProfileMutationErrorKind =
    error.code === "42501"
      ? "permission"
      : ["23502", "23514", "22003"].includes(error.code)
        ? "constraint"
        : "unexpected";

  return new ProfileMutationError(kind, { cause: error });
}

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

export async function updateReadingDaysPerWeek(
  readingDaysPerWeek: number,
): Promise<void> {
  if (
    !Number.isSafeInteger(readingDaysPerWeek) ||
    readingDaysPerWeek < 1 ||
    readingDaysPerWeek > 7
  ) {
    throw new ProfileMutationError("constraint");
  }

  const supabase = await createWritableClient();
  const { data: identity, error: identityError } = await supabase.auth.getClaims();
  const userId = identity?.claims?.sub;

  if (identityError || !userId) {
    throw new ProfileMutationError("unauthenticated", { cause: identityError });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ reading_days_per_week: readingDaysPerWeek })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw mapProfileMutationError(error);
  if (!data) throw new ProfileMutationError("not_found");
}
