import Link from "next/link";

import { signIn } from "@/lib/auth/actions";

import styles from "../../auth.module.css";

type SignInPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const hasCredentialError = params.error === "credenciales";
  const passwordWasUpdated = params.estado === "contrasena-actualizada";

  return (
    <>
      <h1 className={styles.title}>Iniciar sesión</h1>
      <p className={styles.intro}>Continúa construyendo tu diario visual de lectura.</p>

      {hasCredentialError ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          El correo o la contraseña no son correctos.
        </p>
      ) : null}

      {passwordWasUpdated ? (
        <p className={`${styles.message} ${styles.success}`} role="status">
          Tu contraseña se ha actualizado. Ya puedes iniciar sesión.
        </p>
      ) : null}

      <form action={signIn} className={styles.form}>
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
            autoComplete="current-password"
            required
          />
        </div>

        <button className={styles.button} type="submit">
          Iniciar sesión
        </button>
      </form>

      <nav className={styles.links} aria-label="Opciones de acceso">
        <Link href="/registro">Crear una cuenta</Link>
        <Link href="/recuperar-acceso">He olvidado mi contraseña</Link>
      </nav>
    </>
  );
}
