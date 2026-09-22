import Link from "next/link";

import { updatePassword } from "@/lib/auth/actions";

import styles from "../auth.module.css";

type ResetPasswordPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const hasValidationError = params.error === "datos";
  const hasUpdateError = params.error === "actualizacion";

  return (
    <>
      <h1 className={styles.title}>Crear una contraseña nueva</h1>
      <p className={styles.intro}>Elige una contraseña de al menos 8 caracteres.</p>

      {hasValidationError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          Las contraseñas deben coincidir y tener al menos 8 caracteres.
        </p>
      ) : null}

      {hasUpdateError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          No hemos podido actualizar la contraseña. Solicita un enlace nuevo.
        </p>
      ) : null}

      <form action={updatePassword} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Contraseña nueva
          </label>
          <input
            className={styles.input}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirmar contraseña nueva
          </label>
          <input
            className={styles.input}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button className={styles.button} type="submit">
          Actualizar contraseña
        </button>
      </form>

      <nav className={styles.links} aria-label="Opciones de acceso">
        <Link href="/recuperar-acceso">Solicitar otro enlace</Link>
      </nav>
    </>
  );
}
