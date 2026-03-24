import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DetailDrawer from '../components/DetailDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ScorePill from '../components/ScorePill.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function JobsPage() {
  const { state } = useAppState();
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(
    () =>
      state.jobs.filter((job) => {
        const matchesSearch = `${job.companyName} ${job.jobTitle} ${job.location}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === 'all' ? true : job.queueStatus === status;
        return matchesSearch && matchesStatus;
      }),
    [search, state.jobs, status],
  );

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'location', label: 'Location' },
    { key: 'trustScore', label: 'Trust', render: (row) => <ScorePill value={row.trustScore} label="Trust" /> },
    { key: 'relevanceScore', label: 'Relevance', render: (row) => <ScorePill value={row.relevanceScore} label="Fit" /> },
    { key: 'queueStatus', label: 'Queue', render: (row) => <StatusBadge value={row.queueStatus} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Imported Job Inventory"
        description="Search, filter, and inspect every imported job before it reaches manual review or application approval."
        actions={
          <>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role, location" className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500">
              <option value="all">All statuses</option>
              <option value="accepted">Accepted</option>
              <option value="review">Review</option>
              <option value="snoozed">Snoozed</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </>
        }
      />

      {rows.length ? <DataTable columns={columns} rows={rows} onRowClick={setSelectedJob} /> : <EmptyState title="No matching jobs" description="Adjust the filters or add more jobs from the bulk import page." />}

      <DetailDrawer open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} title={selectedJob?.jobTitle} subtitle={selectedJob ? `${selectedJob.companyName} • ${selectedJob.location}` : ''}>
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
                {selectedJob.riskFlags.length ? selectedJob.riskFlags.map((flag) => <span key={flag} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">{flag}</span>) : <span className="text-sm text-slate-400">No active risk flags.</span>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Source URL</div>
              <p className="mt-2 break-all text-sm text-cyan-300">{selectedJob.sourceUrl || 'Imported from spreadsheet only'}</p>
            </div>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export default JobsPage;
