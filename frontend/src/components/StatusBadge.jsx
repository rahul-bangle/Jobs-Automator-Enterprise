const toneMap = {
  accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  snoozed: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  duplicate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  ready: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  approved: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

function StatusBadge({ value }) {
  const tone = toneMap[value] || 'bg-slate-500/15 text-slate-200 border-slate-500/30';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${tone}`}>{value}</span>;
}

export default StatusBadge;
