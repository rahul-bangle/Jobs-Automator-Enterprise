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
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            {state.resumeVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  variant.id === selectedId ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{variant.label}</div>
                    <div className="mt-1 text-sm text-slate-400">{variant.roleFocus}</div>
                  </div>
                  {variant.isBase ? <StatusBadge value="ready" /> : <span className="text-sm text-cyan-200">{variant.matchScore}% match</span>}
                </div>
              </button>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Preview</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selected?.label}</h2>
              </div>
              <div className="text-sm text-cyan-200">{selected?.matchScore}% recommended match</div>
            </div>
            <pre className="mt-6 whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm leading-7 text-slate-200">
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
