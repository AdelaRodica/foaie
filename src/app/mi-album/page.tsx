import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";

import styles from "../shared-page.module.css";

const albumStructure = [
  ["Año", "Cada año será un álbum de tu historia lectora."],
  ["Mes", "Cada mes funcionará como un capítulo dentro de ese álbum."],
  ["Lectura", "Cada sesión terminada se convertirá en un cromo de recuerdo."],
] as const;

export default function ReadingAlbumPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tu historia lectora"
        title="Mi álbum"
        description="Un espacio para recordar y disfrutar lo leído, con las portadas como protagonistas."
      />
      <Surface className={styles.card}>
        <h2>Un diario con forma de álbum</h2>
        <p>Esta es todavía una vista conceptual, sin lecturas ni paginación reales.</p>
        <ol className={styles.steps}>
          {albumStructure.map(([title, description], index) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Surface>
    </div>
  );
}
