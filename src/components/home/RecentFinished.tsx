import Link from "next/link";

import type { HomeReading } from "@/lib/home/types";

import { BookCover } from "./BookCover";
import styles from "./Home.module.css";

function formatCivilDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function RecentFinished({ readings }: Readonly<{
  readings: readonly HomeReading[];
}>) {
  return (
    <ul className={styles.recentList}>
      {readings.map((reading) => (
        <li key={reading.id}>
          <Link href={`/catalogo/${reading.book.workId}`}>
            <BookCover
              src={reading.book.coverSrc}
              title={reading.book.title}
              decorative
            />
            <span className={styles.recentCopy}>
              <strong>{reading.book.title}</strong>
              {reading.book.authors.length > 0 ? (
                <span>{reading.book.authors.join(", ")}</span>
              ) : null}
              {reading.finishedAt ? (
                <time dateTime={reading.finishedAt}>
                  {formatCivilDate(reading.finishedAt)}
                </time>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
