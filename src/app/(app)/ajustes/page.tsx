import { SignOutForm } from "@/components/auth/SignOutForm";
import { TimezoneField } from "@/components/profile/TimezoneField";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { getCurrentUserProfile } from "@/lib/db/profiles";
import { updateProfileAction } from "@/lib/profile/actions";

import pageStyles from "../shared-page.module.css";
import styles from "./page.module.css";

type SettingsPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const isWelcome = params.bienvenida === "1";
  const wasSaved = params.estado === "guardado";
  const hasValidationError = params.error === "datos";
  const hasSaveError = params.error === "guardado";

  let profile = null;

  try {
    profile = await getCurrentUserProfile();
  } catch {
    // La interfaz muestra un error genérico sin exponer detalles de Supabase.
  }

  return (
    <div className={pageStyles.page}>
      <PageHeader
        eyebrow="Tu espacio"
        title="Ajustes"
        description="Adapta Foaie a tus preferencias personales."
      />

      {isWelcome ? (
        <p className={`${styles.message} ${styles.success}`} role="status">
          Tu cuenta está lista. Revisa tus preferencias antes de empezar.
        </p>
      ) : null}

      {wasSaved ? (
        <p className={`${styles.message} ${styles.success}`} role="status">
          Tus preferencias se han guardado.
        </p>
      ) : null}

      {hasValidationError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          Revisa el nombre visible y utiliza una zona horaria IANA válida.
        </p>
      ) : null}

      {hasSaveError || !profile ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          No hemos podido cargar o guardar tus preferencias. Inténtalo de nuevo.
        </p>
      ) : null}

      {profile ? (
        <Surface className={styles.profile}>
          <div>
            <h2>Perfil</h2>
            <p className={styles.profileIntro}>
              Elige cómo quieres aparecer y confirma la zona horaria que utilizará Foaie.
            </p>
          </div>

          <form action={updateProfileAction} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="displayName">
                Nombre visible
              </label>
              <input
                className={styles.input}
                id="displayName"
                name="displayName"
                type="text"
                defaultValue={profile.displayName ?? ""}
                autoComplete="name"
                maxLength={80}
                aria-describedby="display-name-hint"
              />
              <span className={styles.hint} id="display-name-hint">
                Es opcional y puedes cambiarlo cuando quieras.
              </span>
            </div>

            <TimezoneField initialValue={profile.timezone} />

            <button className={styles.saveButton} type="submit">
              Guardar cambios
            </button>
          </form>
        </Surface>
      ) : null}

      <div className={pageStyles.cards}>
        <Surface className={pageStyles.card}>
          <h2>Apariencia</h2>
          <p>En el futuro podrás elegir entre tema claro, oscuro o el ajuste del sistema.</p>
        </Surface>
        <Surface className={pageStyles.card}>
          <h2>Cuenta y privacidad</h2>
          <p>Tu perfil y tus datos permanecen privados y asociados a tu sesión.</p>
          <SignOutForm />
        </Surface>
      </div>
    </div>
  );
}
