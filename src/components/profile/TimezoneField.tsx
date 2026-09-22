"use client";

import { useState, useSyncExternalStore } from "react";

import styles from "./TimezoneField.module.css";

type TimezoneFieldProps = Readonly<{
  initialValue: string;
}>;

function subscribeToTimezone() {
  return () => undefined;
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
}

function getServerTimezone() {
  return null;
}

export function TimezoneField({ initialValue }: TimezoneFieldProps) {
  const [timezone, setTimezone] = useState(initialValue);
  const detectedTimezone = useSyncExternalStore(
    subscribeToTimezone,
    getBrowserTimezone,
    getServerTimezone,
  );

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="timezone">
        Zona horaria
      </label>
      <input
        className={styles.input}
        id="timezone"
        name="timezone"
        type="text"
        value={timezone}
        onChange={(event) => setTimezone(event.target.value)}
        autoComplete="off"
        maxLength={64}
        required
      />
      {detectedTimezone ? (
        <div className={styles.detected}>
          <span>Zona detectada: {detectedTimezone}</span>
          <button
            className={styles.useDetected}
            type="button"
            onClick={() => setTimezone(detectedTimezone)}
          >
            Usar esta zona
          </button>
        </div>
      ) : null}
    </div>
  );
}
