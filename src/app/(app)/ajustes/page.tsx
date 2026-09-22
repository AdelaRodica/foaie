import { SignOutForm } from "@/components/auth/SignOutForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";

import styles from "../shared-page.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tu espacio"
        title="Ajustes"
        description="Aquí podrás adaptar Foaie a tus preferencias cuando exista una cuenta personal."
      />
      <div className={styles.cards}>
        <Surface className={styles.card}>
          <h2>Apariencia</h2>
          <p>En el futuro podrás elegir entre tema claro, oscuro o el ajuste del sistema.</p>
        </Surface>
        <Surface className={styles.card}>
          <h2>Cuenta y privacidad</h2>
          <SignOutForm />
          <p>Las preferencias, los datos y la exportación se incorporarán con el acceso privado.</p>
        </Surface>
      </div>
    </div>
  );
}
