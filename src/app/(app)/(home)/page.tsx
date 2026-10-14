import Link from "next/link";
import { redirect } from "next/navigation";

import { CurrentReadingHero } from "@/components/home/CurrentReadingHero";
import { MonthlyChart } from "@/components/home/MonthlyChart";
import { PeriodSummary } from "@/components/home/PeriodSummary";
import { ReadingGoalsSummary } from "@/components/home/ReadingGoalsSummary";
import { RecentFinished } from "@/components/home/RecentFinished";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { HomeError } from "@/lib/home/server/errors";
import { getHomeOverview } from "@/lib/home/server/queries";

import styles from "./page.module.css";

async function loadHome() {
  try {
    return await getHomeOverview();
  } catch (error) {
    if (error instanceof HomeError && error.kind === "unauthenticated") {
      redirect("/iniciar-sesion");
    }
    return null;
  }
}

const monthNames = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

export default async function HomePage() {
  const overview = await loadHome();

  if (!overview) {
    return (
      <div className={styles.page}>
        <PageHeader
          eyebrow="Inicio"
          title="Tu página de hoy"
          description="Una mirada tranquila a tus lecturas y a lo que has ido construyendo."
          action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
        />
        <EmptyState
          title="No hemos podido cargar tu Inicio"
          description="Tus datos siguen guardados. Inténtalo de nuevo dentro de unos instantes."
          action={<ButtonLink href="/">Volver a intentar</ButtonLink>}
        />
      </div>
    );
  }

  const greeting = overview.displayName
    ? `Tu página de hoy, ${overview.displayName}`
    : "Tu página de hoy";

  if (!overview.hasLibrary) {
    return (
      <div className={styles.page}>
        <PageHeader
          eyebrow="Inicio"
          title={greeting}
          description="Un lugar sereno para continuar leyendo y volver a las historias que te acompañan."
          action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
        />
        <EmptyState
          title="Tu diario empieza con un libro"
          description="Añade una edición a tu Biblioteca para iniciar una lectura y comenzar a guardar su recorrido."
          action={(
            <div className={styles.emptyActions}>
              <ButtonLink href="/biblioteca/nuevo">Buscar libro</ButtonLink>
              <ButtonLink href="/biblioteca/nuevo?mode=create" variant="secondary">
                Añadir manualmente
              </ButtonLink>
            </div>
          )}
        />
      </div>
    );
  }

  const hasReadingHistory =
    overview.activeReadings.length > 0 || overview.recentFinished.length > 0;

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Inicio"
        title={greeting}
        description="Continúa donde lo dejaste y contempla el ritmo de tus lecturas sin prisas."
        action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
      />

      {!hasReadingHistory ? (
        <EmptyState
          title="Tu Biblioteca ya tiene su primera página"
          description="Cuando quieras, inicia una lectura desde Biblioteca. Aquí aparecerán su progreso y tus resúmenes."
          action={<ButtonLink href="/biblioteca">Ir a Biblioteca</ButtonLink>}
        />
      ) : (
        <>
          <div className={styles.heroGrid}>
            {overview.activeReadings.length > 0 ? (
              <CurrentReadingHero readings={overview.activeReadings} />
            ) : (
              <Surface className={styles.noCurrent}>
                <p className={styles.eyebrow}>Tu próxima página</p>
                <h2>No tienes una lectura en curso</h2>
                <p>
                  Puedes volver a una historia pendiente o añadir una nueva cuando te apetezca.
                </p>
                <ButtonLink href="/biblioteca?estado=pending" variant="secondary">
                  Ver pendientes
                </ButtonLink>
              </Surface>
            )}
            <ReadingGoalsSummary overview={overview.readingGoals} />
          </div>

          <Surface className={styles.summarySurface}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Tus cifras</p>
                <h2>Lecturas terminadas</h2>
              </div>
              <Link href="/biblioteca?estado=finished">Ver lecturas</Link>
            </div>
            <p className={styles.definition}>
              Cuenta sesiones terminadas; las relecturas cuentan por separado. Páginas y audio no se convierten entre sí.
            </p>
            <div className={styles.periodGrid}>
              <PeriodSummary
                title={`Este mes · ${monthNames[overview.month - 1]}`}
                summary={overview.monthSummary}
              />
              <PeriodSummary
                title={`Este año · ${overview.year}`}
                summary={overview.yearSummary}
              />
            </div>
          </Surface>

          <Surface className={styles.chartSurface}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Año en curso</p>
                <h2>Lecturas por mes</h2>
              </div>
            </div>
            <MonthlyChart
              counts={overview.monthlyFinishedCounts}
              year={overview.year}
            />
          </Surface>

          {overview.recentFinished.length > 0 ? (
            <Surface className={styles.recentSurface}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Tu historial</p>
                  <h2>Terminados recientemente</h2>
                </div>
                <Link href="/biblioteca?estado=finished">Ver todos</Link>
              </div>
              <RecentFinished readings={overview.recentFinished} />
            </Surface>
          ) : null}
        </>
      )}
    </div>
  );
}
