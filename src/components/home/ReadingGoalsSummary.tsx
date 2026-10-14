import Link from "next/link";

import { Surface } from "@/components/ui/Surface";
import type { ReadingGoalsOverview } from "@/lib/reading-goals/overview";

import styles from "./Home.module.css";

export function ReadingGoalsSummary({ overview }: Readonly<{
  overview: ReadingGoalsOverview;
}>) {
  const goal = overview.goalProgress;
  const visibleWeekDays = Math.min(
    overview.currentWeekActiveDays,
    overview.readingDaysPerWeek,
  );

  return (
    <div className={styles.goalColumn}>
      <Surface className={styles.goalCard}>
        <p className={styles.eyebrow}>Objetivo {overview.year}</p>
        <h2>Reto lector</h2>
        {goal ? (
          <>
            <p className={styles.goalValue}>
              <strong>{goal.currentCount}</strong> de {goal.targetCount} lecturas
            </p>
            <progress
              className={styles.progress}
              value={Math.min(goal.currentCount, goal.targetCount)}
              max={goal.targetCount}
              aria-label={`Objetivo anual: ${goal.currentCount} de ${goal.targetCount} lecturas`}
            />
            <p className={styles.supportingCopy}>
              {goal.exceeded
                ? "Has superado la referencia que elegiste."
                : goal.achieved
                  ? "Has alcanzado la referencia que elegiste."
                  : goal.remainingCount === 1
                    ? "Queda 1 lectura para llegar a tu referencia."
                    : `Quedan ${goal.remainingCount} lecturas para llegar a tu referencia.`}
            </p>
          </>
        ) : (
          <p className={styles.supportingCopy}>
            Si te apetece, puedes elegir una referencia anual en Ajustes.
          </p>
        )}
        <Link href="/ajustes">{goal ? "Editar objetivo" : "Configurar objetivo"}</Link>
      </Surface>

      <Surface className={styles.streakCard}>
        <p className={styles.eyebrow}>Actividad semanal</p>
        <h2>Racha de lectura</h2>
        <p className={styles.weekProgress}>
          Esta semana: <strong>{visibleWeekDays} de {overview.readingDaysPerWeek}</strong>{" "}
          {overview.readingDaysPerWeek === 1 ? "día" : "días"}
        </p>
        <dl className={styles.streakValues}>
          <div>
            <dt>Actual</dt>
            <dd>{overview.streak.current} {overview.streak.current === 1 ? "semana" : "semanas"}</dd>
          </div>
          <div>
            <dt>Mejor</dt>
            <dd>{overview.streak.longest} {overview.streak.longest === 1 ? "semana" : "semanas"}</dd>
          </div>
        </dl>
        <p className={styles.supportingCopy}>
          La semana sigue abierta hasta el domingo.
        </p>
      </Surface>
    </div>
  );
}
