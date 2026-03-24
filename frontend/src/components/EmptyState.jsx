function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-10 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default EmptyState;
