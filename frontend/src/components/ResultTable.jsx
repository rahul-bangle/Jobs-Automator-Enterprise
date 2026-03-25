import React, { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MoreHorizontal, FileText, ExternalLink, ShieldCheck, Target, ArrowRight } from 'lucide-react';

const ResultTable = ({ data = [] }) => {
  const [selectedRow, setSelectedRow] = useState(null);

  const Row = ({ index, style }) => {
    const job = data[index];
    if (!job) return null;

    const statusColors = {
      'applied': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
      'optimized': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
      'parsing': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
      'discovered': 'text-gray-400 border-gray-400/30 bg-gray-400/10',
    };

    return (
      <div 
        style={style} 
        className={`flex items-center px-6 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedRow === index ? 'bg-white/[0.05]' : ''}`}
        onClick={() => setSelectedRow(index)}
      >
        {/* Date */}
        <div className="w-1/6 text-xs text-secondary-text font-mono">
          {job.discovery_date || '2026-03-24'}
        </div>

        {/* Role & Company */}
        <div className="w-2/6 flex flex-col justify-center">
          <span className="text-sm font-semibold text-main-text truncate">{job.job_title}</span>
          <span className="text-xs text-secondary-text truncate">{job.company_name}</span>
        </div>

        {/* Location & Salary */}
        <div className="w-1/6 flex flex-col justify-center">
          <span className="text-xs text-main-text">{job.location}</span>
          <span className="text-[10px] text-accent-cyan font-mono">{job.salary_extracted || 'N/A'}</span>
        </div>

        {/* ATS Score Bloom */}
        <div className="w-1/12 flex flex-col items-center">
          <div className={`text-xs font-bold ${job.ats_score >= 80 ? 'text-green-400' : 'text-accent-cyan'}`}>
            {job.ats_score || '--'}%
          </div>
          <span className="text-[9px] uppercase tracking-tighter text-secondary-text">Match</span>
        </div>

        {/* Resume Version */}
        <div className="w-1/12 flex justify-center">
          <span className="px-1.5 py-0.5 rounded border border-white/10 text-[9px] font-mono text-secondary-text">
            v{job.resume_version || 1}
          </span>
        </div>

        {/* Status Glow */}
        <div className="w-1/6 flex justify-end items-center gap-4">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${statusColors[job.status] || statusColors.discovered}`}>
            {job.status || 'discovered'}
          </span>
          <div className="flex gap-2">
             <button className="p-1.5 rounded-md hover:bg-white/10 text-secondary-text hover:text-white transition-all">
               <FileText size={14} />
             </button>
             <button className="p-1.5 rounded-md hover:bg-white/10 text-secondary-text hover:text-white transition-all">
               <ArrowRight size={14} />
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-deep-bg solid-card-pro overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center px-6 py-4 bg-white/[0.03] border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-secondary-text shadow-xl z-10">
        <div className="w-1/6">Date</div>
        <div className="w-2/6">Role & Company</div>
        <div className="w-1/6">Discovery Details</div>
        <div className="w-1/12 text-center">ATS</div>
        <div className="w-1/12 text-center">Ver</div>
        <div className="w-1/6 text-right">Autonomous Flow</div>
      </div>

      {/* Virtualized Body */}
      <div className="flex-grow">
        <List
          height={600} // This should be dynamic based on parent container
          itemCount={data.length}
          itemSize={64}
          width="100%"
          className="no-scrollbar"
        >
          {Row}
        </List>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] text-secondary-text uppercase tracking-widest">
            <Target size={12} className="text-accent-cyan" />
            <span className="text-main-text font-bold">{data.length}</span> Total Jobs
          </div>
          <div className="flex items-center gap-2 text-[10px] text-secondary-text uppercase tracking-widest">
            <ShieldCheck size={12} className="text-cyan-400" />
            <span className="text-main-text font-bold">{data.filter(j => j.status === 'applied').length}</span> Applied
          </div>
        </div>
        <div className="text-[10px] text-secondary-text italic">
          Virtualized View: Performance Optimized
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
