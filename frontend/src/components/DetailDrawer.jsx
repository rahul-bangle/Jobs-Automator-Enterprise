function DetailDrawer({ open, title, subtitle, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Detail</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white">
            Close
          </button>
        </div>
        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export default DetailDrawer;
