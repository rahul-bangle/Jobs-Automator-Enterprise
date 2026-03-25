import React, { useContext, useEffect, useState } from 'react';
import { AppStateContext } from '../context/appStateContext';
import ResultTable from '../components/ResultTable';
import { Search, Loader2, Play, Pause, Download, Filter } from 'lucide-react';

const HistoryPage = () => {
  const { state } = useContext(AppStateContext);
  const [isSearching, setIsSearching] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // Mock data for initial preview (will connect to state.applications)
  const [mockData, setMockData] = useState(
    Array.from({ length: 1000 }, (_, i) => ({
      id: `job-${i}`,
      discovery_date: '2026-03-24',
      job_title: ['APM', 'PM', 'Tech Lead', 'Staff Engineer'][i % 4],
      company_name: ['Google', 'Meta', 'Amazon', 'Vercel'][i % 4],
      location: 'Remote',
      salary_extracted: '$140k - $190k',
      ats_score: 75 + (i % 20),
      resume_version: (i % 3) + 1,
      status: ['applied', 'optimized', 'discovered', 'parsing'][i % 4]
    }))
  );

  const startDiscovery = async () => {
    setIsSearching(true);
    // [Call to discovery_service endpoint]
    setTimeout(() => setIsSearching(false), 3000);
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-deep-bg p-8 text-main-text animate-fade-in no-scrollbar">
      {/* Header Shell */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">
            Command <span className="text-accent-cyan">Archive</span>
          </h1>
          <p className="text-secondary-text text-sm uppercase tracking-widest font-bold">
            Autonomous Discovery & Audit Control
          </p>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={startDiscovery}
             disabled={isSearching}
             className="px-6 py-3 rounded-md bg-accent-cyan text-black font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
           >
             {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="black" />}
             {isSearching ? "Searching..." : "Start Discovery"}
           </button>
           <button className="p-3 rounded-md border border-white/10 hover:bg-white/5 text-secondary-text">
             <Download size={20} />
           </button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Jobs Scoped", value: "1,248", color: "text-white" },
          { label: "Processed", value: "982", color: "text-blue-400" },
          { label: "Successfully Applied", value: "412", color: "text-cyan-400" },
          { label: "Avg. ATS Score", value: "84%", color: "text-accent-cyan" },
        ].map((stat, i) => (
          <div key={i} className="solid-card-pro p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary-text mb-1">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 mb-4">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
          <input 
            type="text" 
            placeholder="FILTER BY ROLE, COMPANY, OR GEOGRAPHY..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-md py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>
        <button className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary-text">
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Main Table Container */}
      <div className="flex-grow min-h-0">
        <ResultTable data={mockData} />
      </div>
    </div>
  );
};

export default HistoryPage;
