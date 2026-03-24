function MetricCard({ label, value, tone = 'slate', helpText }) {
  const tones = {
    slate: 'from-white via-slate-50 to-slate-100 text-slate-900',
    cyan: 'from-sky-50 via-white to-slate-100 text-sky-700',
    emerald: 'from-emerald-50 via-white to-slate-100 text-emerald-700',
    amber: 'from-amber-50 via-white to-slate-100 text-amber-700',
    rose: 'from-rose-50 via-white to-slate-100 text-rose-700',
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ${tones[tone]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.85),transparent_40%)]" />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{label}</div>
        <div className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{value}</div>
      </div>
      {helpText ? <div className="mt-3 text-sm text-slate-400">{helpText}</div> : null}
    </div>
  );
}

export default MetricCard;
