"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ProfileMutationError,
  updateCurrentUserProfile,
  updateReadingDaysPerWeek,
} from "@/lib/db/profiles";

import {
  profilePreferencesSchema,
  readingDaysPerWeekSchema,
} from "./validation";

export type ProfileActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const PROFILE_ERROR_MESSAGES: Record<ProfileMutationError["kind"], string> = {
  unauthenticated: "Debes iniciar sesión para continuar.",
  not_found: "No se ha encontrado tu perfil.",
  permission: "No se ha podido modificar tu perfil.",
  constraint: "Elige entre 1 y 7 días de lectura por semana.",
  unexpected: "No se ha podido guardar el ritmo de lectura. Inténtalo de nuevo.",
};

export async function updateProfileAction(formData: FormData) {
  const preferences = profilePreferencesSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
  });

  if (!preferences.success) {
    redirect("/ajustes?error=datos");
  }

  try {
    await updateCurrentUserProfile(preferences.data);
  } catch {
    redirect("/ajustes?error=guardado");
  }

  revalidatePath("/ajustes");
  redirect("/ajustes?estado=guardado");
}

export async function updateReadingDaysPerWeekAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = readingDaysPerWeekSchema.safeParse({
    readingDaysPerWeek: formData.get("readingDaysPerWeek"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Elige entre 1 y 7 días de lectura por semana.",
    };
  }

  try {
    await updateReadingDaysPerWeek(parsed.data.readingDaysPerWeek);
    revalidatePath("/ajustes");
    return { status: "success", message: "Ritmo de lectura actualizado." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof ProfileMutationError
          ? PROFILE_ERROR_MESSAGES[error.kind]
          : PROFILE_ERROR_MESSAGES.unexpected,
    };
  }
}
