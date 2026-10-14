import Link from "next/link";

import { ReadingProgressForm } from "@/components/reading/ReadingProgressForm";
import { ReadingTerminalForm } from "@/components/reading/ReadingTerminalForm";
import { Surface } from "@/components/ui/Surface";
import type { HomeReading } from "@/lib/home/types";

import { BookCover } from "./BookCover";
import styles from "./Home.module.css";

function progressTotal(reading: HomeReading) {
  switch (reading.progressUnit) {
    case "PAGES":
      return reading.book.pageCount;
    case "MINUTES":
      return reading.book.audioDurationMinutes;
    case "PERCENT":
      return 100;
  }
}

function progressLabel(reading: HomeReading, total: number | null) {
  const unit = reading.progressUnit === "PAGES"
    ? "páginas"
    : reading.progressUnit === "MINUTES"
      ? "minutos"
      : "%";
  return total === null
    ? `${reading.currentValue} ${unit}`
    : `${reading.currentValue} de ${total} ${unit}`;
}

export function CurrentReadingHero({ readings }: Readonly<{
  readings: readonly HomeReading[];
}>) {
  return (
    <Surface className={styles.currentSurface}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Leyendo ahora</p>
          <h2>{readings.length === 1 ? "Tu lectura actual" : "Tus lecturas actuales"}</h2>
        </div>
        <Link href="/biblioteca?estado=reading">Ver en Biblioteca</Link>
      </div>

      <ul className={styles.currentRail} aria-label="Lecturas actuales">
        {readings.map((reading) => {
          const total = progressTotal(reading);
          const max = total && total > 0 ? total : null;
          const value = max ? Math.min(reading.currentValue, max) : null;

          return (
            <li key={reading.id} className={styles.currentCard}>
              <Link className={styles.bookLink} href={`/catalogo/${reading.book.workId}`}>
                <BookCover
                  src={reading.book.coverSrc}
                  title={reading.book.title}
                  decorative
                />
                <span className={styles.bookCopy}>
                  <strong>{reading.book.title}</strong>
                  {reading.book.authors.length > 0 ? (
                    <span>{reading.book.authors.join(", ")}</span>
                  ) : null}
                  <span className={styles.progressText}>
                    {progressLabel(reading, max)}
                  </span>
                  {value !== null && max !== null ? (
                    <progress
                      className={styles.progress}
                      value={value}
                      max={max}
                      aria-label={`Progreso de ${reading.book.title}: ${progressLabel(reading, max)}`}
                    />
                  ) : null}
                </span>
              </Link>
              <div className={styles.readingActions}>
                <ReadingProgressForm
                  key={`${reading.id}:${reading.currentValue}`}
                  sessionId={reading.id}
                  progressUnit={reading.progressUnit}
                  currentValue={reading.currentValue}
                />
                <ReadingTerminalForm sessionId={reading.id} mode="FINISH" />
                <ReadingTerminalForm sessionId={reading.id} mode="ABANDON" />
              </div>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}
