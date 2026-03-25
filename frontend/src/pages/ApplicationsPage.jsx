import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DetailDrawer from '../components/DetailDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function ApplicationsPage() {
  const { derived, state, actions } = useAppState();
  const [selectedPacket, setSelectedPacket] = useState(null);

  const packetRows = useMemo(
    () =>
      derived.applicationQueue.map((packet) => {
        const job = state.jobs.find((item) => item.id === packet.jobId);
        const resume = state.resumeVariants.find((item) => item.id === packet.resumeVariantId);
        return {
          ...packet,
          companyName: job?.companyName ?? 'Unknown company',
          jobTitle: job?.jobTitle ?? 'Unknown role',
          source: job?.source ?? 'Unknown source',
          resumeLabel: resume?.label ?? 'Unassigned',
          matchScore: resume?.matchScore ?? 0,
        };
      }),
    [derived.applicationQueue, state.jobs, state.resumeVariants],
  );

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'resumeLabel', label: 'Resume Variant' },
    { key: 'matchScore', label: 'ATS Match', render: (row) => (
      <span className={`font-bold ${row.matchScore >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {row.matchScore}%
      </span>
    )},
    { key: 'approvalStatus', label: 'Approval', render: (row) => <StatusBadge value={row.approvalStatus} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Final gate" title="Application Queue" description="These jobs cleared trust and relevance filters. Final approval is still required before any later backend submission step." />

      {packetRows.length ? <DataTable columns={columns} rows={packetRows} onRowClick={setSelectedPacket} /> : <EmptyState title="No application packets yet" description="Approve jobs from the review queue or import more accepted jobs first." />}

      <DetailDrawer open={Boolean(selectedPacket)} onClose={() => setSelectedPacket(null)} title={selectedPacket?.jobTitle} subtitle={selectedPacket ? `${selectedPacket.companyName} • ${selectedPacket.source}` : ''}>
        {selectedPacket ? (
          <>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Fit reasons</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {selectedPacket.fitReasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Warnings</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {(selectedPacket.warnings.length ? selectedPacket.warnings : ['No critical warnings recorded.']).map((warning) => (
                  <li key={warning} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-200" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Resume variant</div>
              <select value={selectedPacket.resumeVariantId} onChange={(event) => actions.setPacketResumeVariant(selectedPacket.id, event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 shadow-sm">
                {state.resumeVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.label} ({variant.matchScore}%)
                  </option>
                ))}
              </select>
            </div>

            {selectedPacket.matchScore < 75 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  ⚠️ Score too low for Submission
                </div>
                <p className="mt-1 text-xs text-rose-600">
                  This resume variant has an ATS score of {selectedPacket.matchScore}%. We require at least 75% for automated submission to ensure success.
                </p>
                <button 
                  onClick={() => actions.optimizeResume(selectedPacket.jobId)}
                  className="mt-3 w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  Tailor this Resume (Groq-Iteration)
                </button>
              </div>
            )}

            <button 
              type="button" 
              disabled={selectedPacket.matchScore < 75 || actions.isProcessing}
              onClick={() => actions.approveApplicationPacket(selectedPacket.id).then(() => setSelectedPacket(null))} 
              className={`w-full rounded-2xl px-4 py-3 font-bold transition ${
                selectedPacket.matchScore < 75 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {selectedPacket.matchScore < 75 ? 'Locked: Needs Optimization' : 'Final approval & Send'}
            </button>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export default ApplicationsPage;
