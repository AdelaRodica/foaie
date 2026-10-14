import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { getAlbumSessionDetail } from "@/lib/album/server/queries";
import { HomeError } from "@/lib/home/server/errors";

import styles from "@/components/album/ReadingAlbum.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatProgress(value: number, unit: "PAGES" | "PERCENT" | "MINUTES") {
  if (unit === "PERCENT") return `${value} %`;
  if (unit === "MINUTES") return `${value} ${value === 1 ? "minuto" : "minutos"}`;
  return `${value} ${value === 1 ? "página" : "páginas"}`;
}

type SessionPageProps = Readonly<{
  params: Promise<{ year: string; sessionId: string }>;
}>;

export default async function AlbumSessionPage({ params }: SessionPageProps) {
  const { year, sessionId } = await params;
  if (!/^\d{1,4}$/.test(year)) notFound();

  let detail;
  try {
    detail = await getAlbumSessionDetail(sessionId);
  } catch (error) {
    if (error instanceof HomeError && error.kind === "unauthenticated") {
      redirect("/iniciar-sesion");
    }
    throw error;
  }
  if (!detail || !detail.reading.finishedAt.startsWith(`${year}-`)) notFound();

  const { reading, progressEntries } = detail;
  const month = Number(reading.finishedAt.slice(5, 7));

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow={`Mi álbum · ${year}`}
        title={reading.book.title}
        description="El registro concreto de esta experiencia de lectura."
      />
      <Link className={styles.backLink} href={`/mi-album/${year}?month=${month}&page=1`}>
        ← Volver al capítulo
      </Link>

      <div className={styles.sessionLayout}>
        <Surface className={styles.sessionCoverCard}>
          <span className={styles.detailCover}>
            {reading.book.coverSrc ? (
              // Catalog covers can come from arbitrary providers.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={reading.book.coverSrc} alt={`Portada de ${reading.book.title}`} referrerPolicy="no-referrer" />
            ) : <span aria-hidden="true">Foaie</span>}
          </span>
          {reading.book.authors.length > 0 ? <p>{reading.book.authors.join(", ")}</p> : null}
          <Link href={`/catalogo/${reading.book.workId}`}>Abrir ficha del libro</Link>
        </Surface>

        <div className={styles.sessionContent}>
          <Surface>
            <h2>Esta lectura</h2>
            <dl className={styles.sessionFacts}>
              <div><dt>Terminada</dt><dd><time dateTime={reading.finishedAt}>{formatDate(reading.finishedAt)}</time></dd></div>
              <div><dt>Progreso final</dt><dd>{formatProgress(reading.currentValue, reading.progressUnit)}</dd></div>
              {reading.startedAt ? <div><dt>Iniciada</dt><dd><time dateTime={reading.startedAt}>{formatDate(reading.startedAt)}</time></dd></div> : null}
            </dl>
          </Surface>

          <Surface>
            <h2>Recorrido de progreso</h2>
            {progressEntries.length === 0 ? (
              <p>No hay actualizaciones de progreso guardadas para esta lectura.</p>
            ) : (
              <ol className={styles.progressHistory}>
                {progressEntries.map((entry) => (
                  <li key={entry.id}>
                    <time dateTime={entry.occurredOn}>{formatDate(entry.occurredOn)}</time>
                    <span>{formatProgress(entry.newValue, reading.progressUnit)}</span>
                    {entry.kind === "CORRECTION" ? <small>Corrección</small> : null}
                  </li>
                ))}
              </ol>
            )}
          </Surface>

          <Surface>
            <h2>Lo que me dejó</h2>
            <p className={styles.unavailable}>
              Las reseñas, notas, citas y recuerdos reflexivos todavía no tienen almacenamiento implementado.
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}
