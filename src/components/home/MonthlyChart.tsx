import styles from "./Home.module.css";

const monthLabels = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export function MonthlyChart({
  counts,
  year,
}: Readonly<{ counts: readonly number[]; year: number }>) {
  const max = Math.max(1, ...counts);

  return (
    <div className={styles.chart} role="img" aria-label={`Lecturas terminadas por mes en ${year}`}>
      <ul>
        {monthLabels.map((label, index) => (
          <li key={label}>
            <span className={styles.chartValue}>{counts[index]}</span>
            <progress
              value={counts[index]}
              max={max}
              aria-label={`${label}: ${counts[index]} lecturas terminadas`}
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
