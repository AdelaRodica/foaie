import { SignOutForm } from "@/components/auth/SignOutForm";
import { ReadingDaysPerWeekForm } from "@/components/profile/ReadingDaysPerWeekForm";
import { TimezoneField } from "@/components/profile/TimezoneField";
import { ReadingGoalDeleteForm } from "@/components/reading-goals/ReadingGoalDeleteForm";
import { ReadingGoalForm } from "@/components/reading-goals/ReadingGoalForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { getCurrentUserProfile } from "@/lib/db/profiles";
import { updateProfileAction } from "@/lib/profile/actions";
import { getReadingGoalsOverviewFromPreferences } from "@/lib/reading-goals/server/queries";

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

  const profile = await getCurrentUserProfile().catch(() => null);
  const readingGoals = profile
    ? await getReadingGoalsOverviewFromPreferences({
        timezone: profile.timezone,
        readingDaysPerWeek: profile.readingDaysPerWeek,
      }).catch(() => null)
    : null;
  const currentWeekDisplayDays = readingGoals
    ? Math.min(
        readingGoals.currentWeekActiveDays,
        readingGoals.readingDaysPerWeek,
      )
    : 0;

  return (
    <div className={pageStyles.page}>
      <PageHeader
        eyebrow="Tu espacio"
        title="Ajustes"
        description="Personaliza cómo quieres acompañar tus lecturas en Foaie."
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

      <Surface className={styles.readingSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>Año en curso</p>
          <h2>Objetivo de lectura</h2>
          {readingGoals ? (
            <p>
              Puedes marcar una referencia para {readingGoals.year}. Podrás
              cambiarla o eliminarla cuando quieras.
            </p>
          ) : (
            <p>
              No hemos podido cargar tu objetivo de lectura. Inténtalo de nuevo
              dentro de unos minutos.
            </p>
          )}
        </div>

        {readingGoals && readingGoals.goal && readingGoals.goalProgress ? (
          <div className={styles.goalContent}>
            <div className={styles.goalSummary}>
              <p className={styles.goalCount}>
                <strong>{readingGoals.goalProgress.currentCount}</strong> de{" "}
                {readingGoals.goalProgress.targetCount} lecturas
              </p>
              <p className={styles.goalStatus}>
                {readingGoals.goalProgress.exceeded
                  ? "Has superado tu objetivo de este año."
                  : readingGoals.goalProgress.achieved
                    ? "Has alcanzado tu objetivo de este año."
                    : readingGoals.goalProgress.remainingCount === 1
                      ? "Te queda 1 lectura para tu objetivo."
                      : `Te quedan ${readingGoals.goalProgress.remainingCount} lecturas para tu objetivo.`}
              </p>
            </div>

            <ReadingGoalForm
              mode="update"
              goalId={readingGoals.goal.id}
              initialTargetCount={readingGoals.goal.targetCount}
            />
            <ReadingGoalDeleteForm
              goalId={readingGoals.goal.id}
              year={readingGoals.year}
            />
          </div>
        ) : readingGoals ? (
          <ReadingGoalForm mode="create" year={readingGoals.year} />
        ) : (
          <p className={styles.loadError} role="alert">
            El objetivo y la racha no están disponibles ahora mismo.
          </p>
        )}
      </Surface>

      {readingGoals ? (
        <Surface className={styles.readingSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>Actividad semanal</p>
            <h2>Racha de lectura</h2>
          </div>

          <dl className={styles.streakStats}>
            <div>
              <dt>Esta semana</dt>
              <dd>
                {currentWeekDisplayDays} de {readingGoals.readingDaysPerWeek}{" "}
                {readingGoals.readingDaysPerWeek === 1 ? "día" : "días"}
              </dd>
              <p>La semana actual sigue abierta hasta el domingo.</p>
            </div>
            <div>
              <dt>Racha actual</dt>
              <dd>
                {readingGoals.streak.current}{" "}
                {readingGoals.streak.current === 1 ? "semana" : "semanas"}
              </dd>
              {readingGoals.streak.current === 0 ? (
                <p>Todavía no hay una racha activa.</p>
              ) : null}
            </div>
            <div>
              <dt>Mejor racha</dt>
              <dd>
                {readingGoals.streak.longest}{" "}
                {readingGoals.streak.longest === 1 ? "semana" : "semanas"}
              </dd>
              {readingGoals.streak.longest === 0 ? (
                <p>Todavía no hay una racha registrada.</p>
              ) : null}
            </div>
          </dl>

          <div className={styles.streakExplanation}>
            <p>
              Cada semana cuenta cuando registras lectura en el número de días
              que hayas elegido, de lunes a domingo.
            </p>
          </div>

          <ReadingDaysPerWeekForm
            initialValue={readingGoals.readingDaysPerWeek}
          />
        </Surface>
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
