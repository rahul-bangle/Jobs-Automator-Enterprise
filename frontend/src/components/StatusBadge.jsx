const toneMap = {
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  snoozed: 'bg-slate-50 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  duplicate: 'bg-slate-50 text-slate-600 border-slate-200',
  ready: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

function StatusBadge({ value }) {
  const tone = toneMap[value] || 'bg-slate-100 text-slate-600 border-slate-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${tone}`}>{value}</span>;
}

export default StatusBadge;
