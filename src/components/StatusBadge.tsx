type Props = { status: unknown };

export function StatusBadge({ status }: Props) {
  const raw = String(status ?? 'unknown').toLowerCase();
  let cls = 'bg-secondary-lt';
  if (raw === 'active' || raw === 'true' || raw === '1') cls = 'bg-green-lt';
  if (raw === 'inactive' || raw === 'draft' || raw === 'false' || raw === '0') cls = 'bg-yellow-lt';
  if (raw === 'disabled' || raw === 'deleted') cls = 'bg-red-lt';

  return <span className={`badge ${cls}`}>{String(status ?? '—')}</span>;
}
