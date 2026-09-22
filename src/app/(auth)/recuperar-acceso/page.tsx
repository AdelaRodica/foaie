import Link from "next/link";

import { requestPasswordReset } from "@/lib/auth/actions";

import styles from "../auth.module.css";

type RecoveryPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams;
  const hasValidationError = params.error === "datos";
  const hasInvalidLink = params.error === "enlace-invalido";
  const requestWasSent = params.estado === "enviado";

  return (
    <>
      <h1 className={styles.title}>Recuperar acceso</h1>
      <p className={styles.intro}>Te enviaremos las instrucciones para elegir una contraseña nueva.</p>

      {hasValidationError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          Introduce un correo electrónico válido.
        </p>
      ) : null}

      {hasInvalidLink ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          El enlace no es válido o ha caducado. Solicita uno nuevo.
        </p>
      ) : null}

      {requestWasSent ? (
        <p className={`${styles.message} ${styles.success}`} role="status">
          Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la
          contraseña.
        </p>
      ) : null}

      <form action={requestPasswordReset} className={styles.form}>
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

        <button className={styles.button} type="submit">
          Enviar instrucciones
        </button>
      </form>

      <nav className={styles.links} aria-label="Opciones de acceso">
        <Link href="/iniciar-sesion">Volver a iniciar sesión</Link>
      </nav>
    </>
  );
}
