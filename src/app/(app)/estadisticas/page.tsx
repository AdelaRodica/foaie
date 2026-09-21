import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

import styles from "../shared-page.module.css";

export default function StatisticsPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Comprender tus hábitos"
        title="Estadísticas"
        description="Este destino explicará tus lecturas con cifras verificables y alternativas accesibles."
      />
      <EmptyState
        title="Las estadísticas necesitan lecturas reales"
        description="Aquí aparecerán el análisis del Reto lector, la Racha de lectura y otras métricas cuando exista actividad registrada."
      />
    </div>
  );
}
