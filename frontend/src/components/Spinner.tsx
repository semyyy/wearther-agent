import styles from "../styles/chat.module.css";

interface Props {
  status: string;
}

export default function Spinner({ status }: Props) {
  return (
    <div className={styles.spinner}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span>{status}</span>
    </div>
  );
}
