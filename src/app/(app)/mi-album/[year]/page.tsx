import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReadingSticker } from "@/components/album/ReadingSticker";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { getAlbumPage } from "@/lib/album/overview";
import { getAlbumYear } from "@/lib/album/server/queries";
import { HomeError } from "@/lib/home/server/errors";

import styles from "@/components/album/ReadingAlbum.module.css";

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseInteger(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function formatAudio(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours === 0 ? `${rest} min` : rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

type AlbumPageProps = Readonly<{
  params: Promise<{ year: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function AlbumYearPage({ params, searchParams }: AlbumPageProps) {
  const [{ year: yearParam }, query] = await Promise.all([params, searchParams]);
  const year = parseInteger(yearParam);
  if (!year || year < 1 || year > 9999) notFound();

  let album;
  try {
    album = await getAlbumYear(year);
  } catch (error) {
    if (error instanceof HomeError && error.kind === "unauthenticated") {
      redirect("/iniciar-sesion");
    }
    throw error;
  }

  const requestedMonth = parseInteger(first(query.month));
  const populatedMonths = album.months.filter(({ readings }) => readings.length > 0);
  const fallbackMonth = year === album.currentYear
    ? album.currentMonth
    : populatedMonths.at(-1)?.month ?? 1;
  const monthNumber = requestedMonth && requestedMonth >= 1 && requestedMonth <= 12
    ? requestedMonth
    : fallbackMonth;
  const month = album.months[monthNumber - 1];
  const requestedPage = parseInteger(first(query.page)) ?? 1;
  const logicalPage = getAlbumPage(month, requestedPage);
  const canonicalHref = `/mi-album/${year}?month=${monthNumber}&page=${logicalPage.page}`;
  if (
    first(query.month) !== String(monthNumber) ||
    first(query.page) !== String(logicalPage.page)
  ) {
    redirect(canonicalHref);
  }
  const yearOptions = [...new Set([...album.availableYears, album.currentYear, year])]
    .sort((left, right) => right - left);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tu historia lectora"
        title={`Mi álbum · ${year}`}
        description="Recorre cada lectura terminada como una página de tu memoria lectora."
      />

      <nav className={styles.yearNav} aria-label="Elegir año del álbum">
        <span>Año</span>
        <ul>
          {yearOptions.map((option) => (
            <li key={option}>
              <Link href={`/mi-album/${option}`} aria-current={option === year ? "page" : undefined}>
                {option}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className={styles.monthNav} aria-label={`Capítulos de ${year}`}>
        <ol>
          {album.months.map((item) => {
            const active = item.month === monthNumber;
            const empty = item.readings.length === 0;
            return (
              <li key={item.month}>
                <Link
                  href={`/mi-album/${year}?month=${item.month}&page=1`}
                  aria-current={active ? "page" : undefined}
                  className={empty ? styles.emptyMonth : undefined}
                >
                  <span>{monthNames[item.month - 1].slice(0, 3)}</span>
                  <small>{empty ? "Sin lecturas" : `${item.readings.length} ${item.readings.length === 1 ? "lectura" : "lecturas"}`}</small>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      {album.summary.finishedCount === 0 ? (
        <EmptyState
          title={`Todavía no hay lecturas terminadas en ${year}`}
          description="Puedes visitar otro año o terminar una lectura para empezar este álbum."
          action={<ButtonLink href="/biblioteca">Ir a Biblioteca</ButtonLink>}
        />
      ) : (
        <div className={styles.chapterLayout}>
          <section className={styles.chapter} aria-labelledby="chapter-title">
            <div className={styles.chapterHeading}>
              <div>
                <p>Capítulo {monthNumber}</p>
                <h2 id="chapter-title">{monthNames[monthNumber - 1]}</h2>
              </div>
              {logicalPage.pageCount > 0 ? (
                <p>Página {logicalPage.page} de {logicalPage.pageCount}</p>
              ) : null}
            </div>

            {month.readings.length === 0 ? (
              <EmptyState
                title="Este mes aún no tiene lecturas terminadas"
                description="El índice anual permanece disponible para continuar por otro capítulo."
              />
            ) : (
              <>
                <ol className={styles.stickerGrid}>
                  {logicalPage.readings.map((reading) => (
                    <li key={reading.id}><ReadingSticker reading={reading} year={year} /></li>
                  ))}
                </ol>
                <nav className={styles.pagination} aria-label={`Páginas de ${monthNames[monthNumber - 1]}`}>
                  {logicalPage.page > 1 ? (
                    <Link href={`/mi-album/${year}?month=${monthNumber}&page=${logicalPage.page - 1}`}>← Página anterior</Link>
                  ) : <span />}
                  <span>Página {logicalPage.page} de {logicalPage.pageCount}</span>
                  {logicalPage.page < logicalPage.pageCount ? (
                    <Link href={`/mi-album/${year}?month=${monthNumber}&page=${logicalPage.page + 1}`}>Página siguiente →</Link>
                  ) : <span />}
                </nav>
              </>
            )}
          </section>

          <aside className={styles.summary} aria-labelledby="month-summary-title">
            <Surface>
              <h2 id="month-summary-title">Resumen de {monthNames[monthNumber - 1].toLowerCase()}</h2>
              <dl>
                <div><dt>Lecturas</dt><dd>{month.summary.finishedCount}</dd></div>
                <div><dt>Páginas</dt><dd>{month.summary.pageCount}</dd></div>
                <div><dt>Audio</dt><dd>{formatAudio(month.summary.audioMinutes)}</dd></div>
              </dl>
              {month.previousMonthDifference !== null ? (
                <p>{month.previousMonthDifference === 0 ? "El mismo número de lecturas que el mes anterior." : `${month.previousMonthDifference > 0 ? "+" : ""}${month.previousMonthDifference} frente al mes anterior.`}</p>
              ) : null}
              <p className={styles.unavailable}>Favorito mensual no disponible todavía.</p>
            </Surface>
          </aside>
        </div>
      )}

      {album.summary.finishedCount > 0 ? (
        <Surface className={styles.yearClosing}>
          <p className={styles.closingEyebrow}>Cierre anual</p>
          <h2>Mi {year}</h2>
          <dl>
            <div><dt>Lecturas</dt><dd>{album.summary.finishedCount}</dd></div>
            <div><dt>Páginas</dt><dd>{album.summary.pageCount}</dd></div>
            <div><dt>Audio</dt><dd>{formatAudio(album.summary.audioMinutes)}</dd></div>
            <div><dt>Mejor racha</dt><dd>{album.longestStreak} {album.longestStreak === 1 ? "semana" : "semanas"}</dd></div>
          </dl>
          {album.goalProgress ? (
            <p>Reto lector: {album.goalProgress.currentCount} de {album.goalProgress.targetCount} lecturas{album.goalProgress.achieved ? " · alcanzado" : ""}.</p>
          ) : <p>Este año no tiene un Reto lector configurado.</p>}
        </Surface>
      ) : null}
    </div>
  );
}
