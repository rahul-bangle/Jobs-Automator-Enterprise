import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import ResultTable from '../components/ResultTable';

const API_BASE = 'http://localhost:8001/api/v1/v2';

const HistoryPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchHistory = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/history`);
      setData(resp.data || []);
    } catch (err) {
      console.error('History Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOptimize = async (jobId) => {
    setStatus(`Optimizing resume for job: ${jobId}...`);
    try {
      await axios.post(`${API_BASE}/optimize/${jobId}`);
      await fetchHistory();
      setStatus(`Optimization complete.`);
    } catch (err) {
      console.error(err);
      setStatus('Optimization failed.');
    }
  };

  const handleApply = async (jobId) => {
    setStatus(`Deploying application...`);
    try {
      await axios.post(`${API_BASE}/apply/${jobId}`);
      await fetchHistory();
      setStatus(`Deployment successful.`);
    } catch (err) {
      console.error(err);
      setStatus('Deployment failed.');
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-slate-50 p-8 text-slate-900 animate-fade-in no-scrollbar overflow-hidden">
      {/* Header Shell */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">
            Command <span className="text-blue-600">Archive</span>
          </h1>
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">
            Autonomous Discovery & Audit Control
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
           {status && (
             <div className="flex items-center gap-2 text-xs font-bold text-pro-blue bg-pro-blue/5 px-4 py-2 rounded-lg border border-pro-blue/10 mr-4 animate-in fade-in slide-in-from-right-2">
               <div className="w-1.5 h-1.5 rounded-full bg-pro-blue animate-pulse" />
               {status}
             </div>
           )}
           <button 
             onClick={fetchHistory}
             className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
           >
             <Download size={18} />
             Refresh History
           </button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Jobs Scoped", value: data.length, color: "text-slate-900" },
          { label: "Processed", value: data.filter(j => j.status === 'applied').length, color: "text-blue-600" },
          { label: "Success Rate", value: data.length ? Math.round((data.filter(j => j.status === 'applied').length / data.length) * 100) + "%" : "0%", color: "text-emerald-600" },
          { label: "Avg. Match", value: data.length ? Math.round(data.reduce((acc, curr) => acc + (curr.ats_score || 0), 0) / data.length) + "%" : "0%", color: "text-blue-600" },
        ].map((stat, i) => (
          <div key={i} className="pro-glass-card p-4 flex flex-col items-center bg-white border-slate-200">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="flex-grow min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 animate-spin text-pro-blue opacity-50" />
          </div>
        ) : data.length ? (
          <ResultTable 
            data={data} 
            onOptimize={handleOptimize} 
            onApply={handleApply} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">No history detected</p>
            <p className="text-xs mt-2 opacity-30">Scan for jobs in Discovery to populate this archive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
