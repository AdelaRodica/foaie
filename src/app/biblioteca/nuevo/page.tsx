import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

import styles from "../../shared-page.module.css";

export default function NewBookPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Biblioteca"
        title="Añadir libro"
        description="El alta manual y la búsqueda de metadatos se incorporarán cuando construyamos el catálogo."
      />
      <EmptyState
        title="El formulario llegará en una etapa posterior"
        description="Esta ruta ya forma parte de la navegación, pero todavía no guarda información ni se conecta a servicios externos."
        action={<ButtonLink href="/biblioteca" variant="secondary">Volver a Biblioteca</ButtonLink>}
      />
    </div>
  );
}
