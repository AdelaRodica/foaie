import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Inicio"
        title="Tu diario empieza con un libro"
        description="Foaie será el lugar donde guardarás tus lecturas, seguirás su recorrido y volverás a los recuerdos que dejaron."
      />

      <div className={styles.grid}>
        <Surface className={styles.welcome}>
          <p className={styles.kicker}>Tu próxima página</p>
          <h2>Construye una biblioteca que se parezca a ti</h2>
          <p>
            Añade tu primer libro o recorre la estructura de Foaie mientras
            preparamos las funciones de lectura.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/biblioteca/nuevo">Añadir un libro</ButtonLink>
            <ButtonLink href="/biblioteca" variant="secondary">
              Ver Biblioteca
            </ButtonLink>
          </div>
        </Surface>

        <Surface className={styles.future}>
          <p className={styles.kicker}>Más adelante</p>
          <h2>Tu lectura, a tu ritmo</h2>
          <p>
            Aquí podrás seguir tu Reto lector y tu Racha de lectura, siempre a
            partir de la actividad que decidas registrar.
          </p>
          <p className={styles.note}>
            Esta vista todavía no muestra datos personales ni métricas.
          </p>
        </Surface>
      </div>
    </div>
  );
}
