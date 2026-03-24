import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function SubmissionsPage() {
  const { state, derived } = useAppState();

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'timestamp', label: 'Time', render: (row) => new Date(row.timestamp).toLocaleString() },
    { key: 'outcome', label: 'Outcome', render: (row) => <StatusBadge value={row.outcome} /> },
    { key: 'failureReason', label: 'Failure Reason', render: (row) => row.failureReason || 'None' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operational history" title="Submission Log" description="This is where final approvals, failures, and later backend submission attempts are tracked in a single operational view." />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Approved" value={derived.dashboardStats.approved} tone="cyan" />
        <MetricCard label="Failed" value={derived.dashboardStats.failed} tone="rose" />
        <MetricCard label="Manual Follow-up" value={state.submissionAttempts.filter((item) => item.failureReason).length} tone="amber" />
      </div>

      {state.submissionAttempts.length ? <DataTable columns={columns} rows={state.submissionAttempts} /> : <EmptyState title="No submission activity" description="Once packets are approved, this page logs the resulting actions." />}
    </div>
  );
}

export default SubmissionsPage;
