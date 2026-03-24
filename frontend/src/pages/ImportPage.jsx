import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAppState } from '../context/useAppState.jsx';

function ImportPage() {
  const { preview, isProcessing, loadingProgress, actions } = useAppState();
  const [urls, setUrls] = useState('');
  const [fileName, setFileName] = useState('');

  const previewRows = preview?.rows ?? [];

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'jobTitle', label: 'Role' },
    { key: 'source', label: 'Source' },
    { key: 'location', label: 'Location' },
    { key: 'trustScore', label: 'Trust' },
    { key: 'relevanceScore', label: 'Relevance' },
    { key: 'queueStatus', label: 'Queue', render: (row) => <StatusBadge value={row.queueStatus} /> },
  ];

  const handlePreview = async (event) => {
    event.preventDefault();
    await actions.previewImport({ fileName, urls });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bulk intake"
        title="CSV/XLSX and Batch URL Import"
        description="Connect your job sources to the AI engine. Paste URLs or upload spreadsheets to trigger live scraping and scoring."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <form onSubmit={handlePreview} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <div>
            <label className="text-sm font-medium text-slate-200">Spreadsheet file name</label>
            <input 
              value={fileName} 
              onChange={(event) => setFileName(event.target.value)} 
              placeholder="pm_leads_march.xlsx" 
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Paste job URLs</label>
            <textarea 
              value={urls} 
              onChange={(event) => setUrls(event.target.value)} 
              rows="12" 
              placeholder="One URL per line" 
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500" 
            />
          </div>
          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={isProcessing}
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Preview batch'}
            </button>
            <button 
              type="button" 
              onClick={() => actions.clearPreview()} 
              className="rounded-2xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:border-slate-500 hover:text-white"
            >
              Clear preview
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 overflow-hidden relative">
          {/* Pro Max Progress Bar */}
          {isProcessing && (
            <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-900">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-white">Import Summary</h2>
              <p className="mt-1 text-sm text-slate-400">Preview accepted, review, and rejected jobs.</p>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{loadingProgress}% Analyzing</span>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500 text-[10px]">Rows</div>
              <div className="mt-2 text-2xl font-semibold text-white">{previewRows.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-emerald-200 text-[10px]">Accepted</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-200">{preview?.summary.accepted ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-200 text-[10px]">Review</div>
              <div className="mt-2 text-2xl font-semibold text-amber-200">{preview?.summary.review ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-rose-200 text-[10px]">Rejected</div>
              <div className="mt-2 text-2xl font-semibold text-rose-200">{preview?.summary.rejected ?? 0}</div>
            </div>
          </div>

          <div className="mt-6">
            <DataTable columns={columns} rows={previewRows} />
          </div>

          <div className="mt-6 flex gap-3">
            <button 
              type="button" 
              disabled={!preview || isProcessing} 
              onClick={() => actions.confirmImportBatch()} 
              className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition enabled:hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm import
            </button>
            <div className="self-center text-sm text-slate-500">
              Pushes {preview?.summary.accepted ?? 0} jobs to the queue.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ImportPage;
