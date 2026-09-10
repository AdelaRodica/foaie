import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";

import styles from "../shared-page.module.css";

export default function MorePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Navegación"
        title="Más"
        description="Accede a los destinos secundarios de Foaie desde la navegación móvil."
      />
      <Surface className={styles.card}>
        <h2>Otros destinos</h2>
        <div className={styles.links}>
          <ButtonLink href="/estadisticas" variant="secondary">Estadísticas</ButtonLink>
          <ButtonLink href="/ajustes" variant="secondary">Ajustes</ButtonLink>
        </div>
      </Surface>
    </div>
  );
}
