import type { HomePeriodSummary } from "@/lib/home/types";

import styles from "./Home.module.css";

const numberFormatter = new Intl.NumberFormat("es-ES");

function formatAudio(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

export function PeriodSummary({
  title,
  summary,
}: Readonly<{ title: string; summary: HomePeriodSummary }>) {
  return (
    <article className={styles.periodCard}>
      <h3>{title}</h3>
      <dl className={styles.periodValues}>
        <div>
          <dt>Lecturas</dt>
          <dd>{numberFormatter.format(summary.finishedCount)}</dd>
        </div>
        <div>
          <dt>Páginas</dt>
          <dd>{numberFormatter.format(summary.pageCount)}</dd>
        </div>
        <div>
          <dt>Audio</dt>
          <dd>{formatAudio(summary.audioMinutes)}</dd>
        </div>
      </dl>
      {summary.readingsWithoutPages > 0 || summary.readingsWithoutAudioDuration > 0 ? (
        <p className={styles.missingData}>
          Totales parciales: {[
            summary.readingsWithoutPages > 0
              ? `${summary.readingsWithoutPages} ${summary.readingsWithoutPages === 1 ? "lectura sin páginas" : "lecturas sin páginas"}`
              : null,
            summary.readingsWithoutAudioDuration > 0
              ? `${summary.readingsWithoutAudioDuration} ${summary.readingsWithoutAudioDuration === 1 ? "audio sin duración" : "audios sin duración"}`
              : null,
          ].filter(Boolean).join(" · ")}.
        </p>
      ) : null}
    </article>
  );
}
