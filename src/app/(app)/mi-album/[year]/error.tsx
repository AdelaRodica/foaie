"use client";

import { useEffect } from "react";

import styles from "@/components/album/ReadingAlbum.module.css";

export default function AlbumError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("No se ha podido cargar Mi álbum.", error);
  }, [error]);

  return (
    <div className={styles.albumError} role="alert">
      <h2>No hemos podido abrir este álbum</h2>
      <p>Tus lecturas siguen guardadas. Puedes volver a intentarlo.</p>
      <button type="button" onClick={reset}>Volver a intentar</button>
    </div>
  );
}
