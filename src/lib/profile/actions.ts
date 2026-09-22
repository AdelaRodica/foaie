"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateCurrentUserProfile } from "@/lib/db/profiles";

import { profilePreferencesSchema } from "./validation";

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
