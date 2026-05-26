export default function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <small className="stat-hint">{hint}</small>
    </article>
  );
}
