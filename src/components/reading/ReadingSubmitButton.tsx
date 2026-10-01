"use client";

import { useFormStatus } from "react-dom";

import styles from "./ReadingControls.module.css";

type ReadingSubmitButtonProps = Readonly<{
  idleLabel: string;
  pendingLabel: string;
}>;

export function ReadingSubmitButton({
  idleLabel,
  pendingLabel,
}: ReadingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
