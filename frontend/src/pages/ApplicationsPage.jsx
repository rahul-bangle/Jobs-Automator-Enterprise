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
        };
      }),
    [derived.applicationQueue, state.jobs, state.resumeVariants],
  );

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'resumeLabel', label: 'Resume Variant' },
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
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Fit reasons</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {selectedPacket.fitReasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Warnings</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(selectedPacket.warnings.length ? selectedPacket.warnings : ['No critical warnings recorded.']).map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Resume variant</div>
              <select value={selectedPacket.resumeVariantId} onChange={(event) => actions.setPacketResumeVariant(selectedPacket.id, event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500">
                {state.resumeVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => actions.approveApplicationPacket(selectedPacket.id).then(() => setSelectedPacket(null))} className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300">
              Final approval
            </button>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export default ApplicationsPage;
