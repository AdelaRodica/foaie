"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createWritableClient } from "@/lib/supabase/server";

import {
  recoverySchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./validation";

export async function signIn(formData: FormData) {
  const credentials = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    redirect("/iniciar-sesion?error=credenciales");
  }

  const supabase = await createWritableClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error) {
    redirect("/iniciar-sesion?error=credenciales");
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const credentials = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!credentials.success) {
    redirect("/registro?error=datos");
  }

  const supabase = await createWritableClient();

  await supabase.auth.signUp({
    email: credentials.data.email,
    password: credentials.data.password,
    options: {
      emailRedirectTo: new URL(
        "/auth/callback/confirm",
        env.NEXT_PUBLIC_APP_URL,
      ).toString(),
    },
  });

  redirect("/registro?estado=revisa-correo");
}

export async function requestPasswordReset(formData: FormData) {
  const recovery = recoverySchema.safeParse({ email: formData.get("email") });

  if (!recovery.success) {
    redirect("/recuperar-acceso?error=datos");
  }

  const supabase = await createWritableClient();

  await supabase.auth.resetPasswordForEmail(recovery.data.email, {
    redirectTo: new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL).toString(),
  });

  redirect("/recuperar-acceso?estado=enviado");
}

export async function updatePassword(formData: FormData) {
  const passwords = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!passwords.success) {
    redirect("/restablecer-acceso?error=datos");
  }

  const supabase = await createWritableClient();
  const {
    data: { user },
    error: identityError,
  } = await supabase.auth.getUser();

  if (identityError || !user) {
    redirect("/recuperar-acceso?error=enlace-invalido");
  }

  const { error } = await supabase.auth.updateUser({
    password: passwords.data.password,
  });

  if (error) {
    redirect("/restablecer-acceso?error=actualizacion");
  }

  redirect("/iniciar-sesion?estado=contrasena-actualizada");
}
