function ScorePill({ value, label }) {
  let tone = 'text-rose-700 border-rose-200 bg-rose-50';
  if (value >= 85) tone = 'text-emerald-700 border-emerald-200 bg-emerald-50';
  else if (value >= 70) tone = 'text-blue-700 border-blue-200 bg-blue-50';
  else if (value >= 55) tone = 'text-amber-700 border-amber-200 bg-amber-50';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {label}: {value}
    </span>
  );
}

export default ScorePill;
