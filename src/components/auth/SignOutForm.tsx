import { signOutAction } from "@/lib/auth/actions";

import styles from "./SignOutForm.module.css";

export function SignOutForm() {
  return (
    <form action={signOutAction}>
      <button className={styles.button} type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}
