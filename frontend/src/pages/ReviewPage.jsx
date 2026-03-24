import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DetailDrawer from '../components/DetailDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ScorePill from '../components/ScorePill.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function ReviewPage() {
  const { derived, actions } = useAppState();
  const [selectedJob, setSelectedJob] = useState(null);

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'trustScore', label: 'Trust', render: (row) => <ScorePill value={row.trustScore} label="Trust" /> },
    { key: 'relevanceScore', label: 'Relevance', render: (row) => <ScorePill value={row.relevanceScore} label="Fit" /> },
    { key: 'queueStatus', label: 'Status', render: (row) => <StatusBadge value={row.queueStatus} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Manual triage" title="Review Queue" description="Borderline, suspicious, or unsupported jobs stop here until you explicitly approve, reject, snooze, or mark them duplicate." />

      {derived.reviewQueue.length ? <DataTable columns={columns} rows={derived.reviewQueue} onRowClick={setSelectedJob} /> : <EmptyState title="Review queue clear" description="All current jobs are either accepted, rejected, or already moved out of triage." />}

      <DetailDrawer open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} title={selectedJob?.jobTitle} subtitle={selectedJob ? `${selectedJob.companyName} • ${selectedJob.source}` : ''}>
        {selectedJob ? (
          <>
            <div className="flex flex-wrap gap-3">
              <ScorePill value={selectedJob.trustScore} label="Trust" />
              <ScorePill value={selectedJob.relevanceScore} label="Relevance" />
              <StatusBadge value={selectedJob.queueStatus} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Fit summary</div>
              <p className="mt-2 text-sm text-slate-300">{selectedJob.fitSummary}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Risk flags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedJob.riskFlags.map((flag) => (
                  <span key={flag} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => actions.approveReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300">
                Approve into application queue
              </button>
              <button type="button" onClick={() => actions.rejectReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl bg-rose-400 px-4 py-3 font-medium text-slate-950 hover:bg-rose-300">
                Reject
              </button>
              <button type="button" onClick={() => actions.snoozeReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl border border-slate-700 px-4 py-3 font-medium text-slate-200 hover:border-slate-500">
                Snooze
              </button>
              <button type="button" onClick={() => actions.markDuplicate(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl border border-slate-700 px-4 py-3 font-medium text-slate-200 hover:border-slate-500">
                Mark duplicate
              </button>
            </div>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export default ReviewPage;
