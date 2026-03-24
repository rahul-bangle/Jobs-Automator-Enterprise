function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">{eyebrow}</div> : null}
        <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
