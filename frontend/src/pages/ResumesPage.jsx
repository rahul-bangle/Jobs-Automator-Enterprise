import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function ResumesPage() {
  const { state } = useAppState();
  const [selectedId, setSelectedId] = useState(state.resumeVariants[0]?.id ?? '');

  const selected = useMemo(() => state.resumeVariants.find((variant) => variant.id === selectedId), [selectedId, state.resumeVariants]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Resume assets" title="Resume Variants" description="Frontend-first variant management for PM, APM, and adjacent-role applications. This will later map cleanly to generated backend assets." />

      {state.resumeVariants.length ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md shadow-sm">
            {state.resumeVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                className={`w-full rounded-2xl border p-4 text-left transition shadow-sm ${
                  variant.id === selectedId ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{variant.label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-500">{variant.roleFocus}</div>
                  </div>
                  {variant.isBase ? <StatusBadge value="ready" /> : <span className="text-sm font-bold text-blue-600">{variant.matchScore}% match</span>}
                </div>
              </button>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Preview</div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selected?.label}</h2>
              </div>
              <div className="text-sm font-bold text-blue-600">{selected?.matchScore}% match</div>
            </div>
            <pre className="mt-6 whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-600 shadow-inner overflow-x-auto">
              {selected?.content}
            </pre>
          </section>
        </div>
      ) : (
        <EmptyState title="No resume variants" description="Backend generation will later populate variants here; the frontend contract is already in place." />
      )}
    </div>
  );
}

export default ResumesPage;
