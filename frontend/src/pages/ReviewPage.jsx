import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DetailDrawer from '../components/DetailDrawer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ScorePill from '../components/ScorePill.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function ReviewPage() {
  const { derived, actions, isProcessing } = useAppState();
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'study'
  const [studyGuide, setStudyGuide] = useState(null);

  const handleFetchStudy = async (id) => {
    setActiveTab('study');
    if (!studyGuide) {
      const result = await actions.fetchStudyGuide(id);
      setStudyGuide(result);
    }
  };

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
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                ATS: {selectedJob.atsScore || '--'}%
              </div>
              <StatusBadge value={selectedJob.queueStatus} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'summary' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400'}`}
              >
                Summary
              </button>
              <button 
                onClick={() => handleFetchStudy(selectedJob.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'study' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400'}`}
              >
                Study Guide
              </button>
            </div>

            {activeTab === 'summary' ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Fit summary</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedJob.fitSummary}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Risk flags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedJob.riskFlags.map((flag) => (
                      <span key={flag} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {studyGuide ? (
                  <>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase text-slate-400">Company Context</div>
                      <p className="mt-1 text-sm text-slate-600 italic">"{studyGuide.business_context}"</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">Skill Gaps (What to Learn)</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {studyGuide.skill_gaps.map(gap => (
                          <span key={gap} className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">-{gap}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400">Research Prompts</div>
                      <ul className="mt-2 space-y-2">
                        {studyGuide.research_prompts.map((p, i) => (
                          <li key={i} className="flex gap-3 rounded-xl border border-slate-100 p-3 text-sm text-slate-600 hover:border-cyan-200 hover:bg-cyan-50/30">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold">{i+1}</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center text-slate-400">Analyzing job requirements...</div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button" 
                  disabled={isProcessing}
                  onClick={() => actions.optimizeResume(selectedJob.id)}
                  className="rounded-2xl border border-blue-500 bg-blue-50 px-4 py-3 font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition shadow-sm"
                >
                  {isProcessing ? 'Tailoring CV...' : '🚀 Optimize Resume'}
                </button>
                <button type="button" onClick={() => actions.approveReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-800 transition shadow-sm">
                  Approve Job
                </button>
              </div>
              <button type="button" onClick={() => actions.rejectReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl bg-rose-50 px-4 py-3 font-bold text-rose-700 border border-rose-100 hover:bg-rose-100 transition">
                Reject
              </button>
              <button type="button" onClick={() => actions.snoozeReviewItem(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                Snooze for Later
              </button>
              <button type="button" onClick={() => actions.markDuplicate(selectedJob.id).then(() => setSelectedJob(null))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                Mark Duplicate
              </button>
            </div>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export default ReviewPage;
