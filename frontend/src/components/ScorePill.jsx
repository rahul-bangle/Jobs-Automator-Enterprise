function ScorePill({ value, label }) {
  let tone = 'text-rose-300 border-rose-500/30 bg-rose-500/10';
  if (value >= 85) tone = 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  else if (value >= 70) tone = 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10';
  else if (value >= 55) tone = 'text-amber-300 border-amber-500/30 bg-amber-500/10';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {label}: {value}
    </span>
  );
}

export default ScorePill;
