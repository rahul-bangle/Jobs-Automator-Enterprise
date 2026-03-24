import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function DashboardPage() {
  const { derived, state } = useAppState();
  const stats = derived.dashboardStats;

  const batchColumns = [
    { key: 'fileName', label: 'Batch' },
    { key: 'sourceType', label: 'Source' },
    { key: 'totalRows', label: 'Rows' },
    { key: 'acceptedRows', label: 'Accepted' },
    { key: 'reviewRows', label: 'Review' },
    { key: 'rejectedRows', label: 'Rejected' },
  ];

  const submissionColumns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'timestamp', label: 'Time', render: (row) => new Date(row.timestamp).toLocaleString() },
    { key: 'outcome', label: 'Outcome', render: (row) => <StatusBadge value={row.outcome} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Frontend complete-first"
        title="Application Operations Dashboard"
        description="A trusted-source PM job pipeline with bulk import, review-first routing, final approval, and backend-ready mock contracts."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Imported" value={stats.totalImported} tone="slate" helpText="Current jobs in local mock state." />
        <MetricCard label="Trusted Accepted" value={stats.trustedAccepted} tone="emerald" helpText="Jobs already cleared for application packet prep." />
        <MetricCard label="Review Queue" value={stats.inReview} tone="amber" helpText="Needs manual trust or relevance confirmation." />
        <MetricCard label="Ready To Apply" value={stats.readyToApply} tone="cyan" helpText="Waiting for final approval in the applications queue." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Recent Import Batches</h2>
          <p className="mt-2 text-sm text-slate-400">Bulk-upload workflow is active and backend contracts are already reflected in the UI.</p>
          <div className="mt-5">
            <DataTable columns={batchColumns} rows={derived.recentBatches} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Campaign Snapshot</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Target roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.campaign?.targetRoles.map((role) => (
                  <span key={role} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Locations</div>
              <p className="mt-2">{state.campaign?.preferredLocations}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Trust / Relevance Thresholds</div>
              <p className="mt-2">
                {state.campaign?.trustThreshold} / {state.campaign?.relevanceThreshold}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
        <h2 className="text-xl font-semibold text-white">Submission Activity</h2>
        <p className="mt-2 text-sm text-slate-400">Approval events are mocked now and will later map directly to backend submission records.</p>
        <div className="mt-5">
          <DataTable columns={submissionColumns} rows={state.submissionAttempts} />
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
