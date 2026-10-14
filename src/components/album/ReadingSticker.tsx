import Link from "next/link";

import type { ReadingSticker as ReadingStickerData } from "@/lib/album/types";

import styles from "./ReadingAlbum.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function ReadingSticker({
  reading,
  year,
}: Readonly<{ reading: ReadingStickerData; year: number }>) {
  return (
    <article className={styles.sticker}>
      <Link href={`/mi-album/${year}/sesiones/${reading.id}`}>
        <span className={styles.cover}>
          {reading.book.coverSrc ? (
            // Catalog covers can come from arbitrary providers.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={reading.book.coverSrc} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <span aria-hidden="true">Foaie</span>
          )}
        </span>
        <span className={styles.stickerCopy}>
          {reading.isReread ? <span className={styles.reread}>Relectura</span> : null}
          <strong>{reading.book.title}</strong>
          {reading.book.authors.length > 0 ? <span>{reading.book.authors.join(", ")}</span> : null}
          <time dateTime={reading.finishedAt}>{formatDate(reading.finishedAt)}</time>
        </span>
      </Link>
    </article>
  );
}
