import styles from "./Home.module.css";

type BookCoverProps = Readonly<{
  src: string | null;
  title: string;
  decorative?: boolean;
}>;

export function BookCover({ src, title, decorative = false }: BookCoverProps) {
  return (
    <span className={styles.cover}>
      {src ? (
        // Catalog covers can come from arbitrary user-supplied providers.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={decorative ? "" : `Portada de ${title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">Foaie</span>
      )}
    </span>
  );
}
