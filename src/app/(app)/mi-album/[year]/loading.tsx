import styles from "@/components/album/ReadingAlbum.module.css";

export default function AlbumLoading() {
  return (
    <div className={styles.albumLoading} aria-busy="true" aria-label="Cargando Mi álbum">
      <span />
      <span />
      <div>{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
    </div>
  );
}
