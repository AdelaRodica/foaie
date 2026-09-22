import Link from "next/link";

import { signUp } from "@/lib/auth/actions";

import styles from "../../auth.module.css";

type SignUpPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const hasValidationError = params.error === "datos";
  const hasConfirmationError = params.error === "confirmacion";
  const shouldCheckEmail = params.estado === "revisa-correo";

  return (
    <>
      <h1 className={styles.title}>Crear una cuenta</h1>
      <p className={styles.intro}>Empieza un espacio privado para tus lecturas.</p>

      {hasValidationError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          Revisa el correo y confirma que la contraseña tenga al menos 8 caracteres.
        </p>
      ) : null}

      {hasConfirmationError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          No hemos podido confirmar la cuenta. Solicita un nuevo enlace de registro.
        </p>
      ) : null}

      {shouldCheckEmail ? (
        <p className={`${styles.message} ${styles.success}`} role="status">
          Revisa tu correo para confirmar tu cuenta.
        </p>
      ) : null}

      <form action={signUp} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Correo electrónico
          </label>
          <input
            className={styles.input}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Contraseña
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
            Confirmar contraseña
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
          Crear cuenta
        </button>
      </form>

      <nav className={styles.links} aria-label="Opciones de acceso">
        <Link href="/iniciar-sesion">Ya tengo una cuenta</Link>
      </nav>
    </>
  );
}
