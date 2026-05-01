export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value || 'Unknown'}</strong>
    </article>
  );
}
