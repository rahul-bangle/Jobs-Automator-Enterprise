function EmptyState({ title, description }) {
  return (
    <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

export default EmptyState;
