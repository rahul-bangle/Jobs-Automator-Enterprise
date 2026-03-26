import React from 'react';
import { MapPin, DollarSign, Building2, ExternalLink, Sparkles, Send, Globe, Zap } from 'lucide-react';

const JobCard = ({ job, onOptimize, onApply, onGrowth }) => {
  const {
    job_title,
    company_name,
    location,
    salary_extracted,
    site,
    source_url,
    relevance_score,
    ats_score,
    status
  } = job;

  const getSourceIcon = (siteName) => {
    const s = siteName?.toLowerCase() || '';
    if (s.includes('linkedin')) return <span className="text-blue-500 font-bold">in</span>;
    if (s.includes('indeed')) return <span className="text-blue-600 font-bold">i</span>;
    if (s.includes('glassdoor')) return <span className="text-green-500 font-bold">g</span>;
    return <Globe size={14} className="text-slate-400" />;
  };

  const score = relevance_score || ats_score;
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="pro-glass-card group p-6 h-full flex flex-col justify-between relative overflow-hidden">
      {score > 0 && (
        <div className={`absolute -top-1 -right-1 flex items-center gap-1.5 rounded-bl-2xl border-l border-b px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-sm z-10 ${getScoreColor(score)}`}>
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          {score}% Match
        </div>
      )}
      <div>
        {/* Header: Company & Action */}
        <div className="flex justify-between items-start mb-4 pr-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-pro-blue font-bold">
              {company_name?.charAt(0) || <Building2 size={20} />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-slate-900 font-bold group-hover:text-pro-blue transition-colors text-lg line-clamp-2 leading-tight mb-1" title={job_title}>
                {job_title}
              </h3>
              <p className="text-slate-500 text-sm font-medium truncate opacity-80">{company_name}</p>
            </div>
          </div>
          
          <a 
            href={source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-pro-blue/10 text-slate-400 hover:text-pro-blue transition-all border border-slate-200 hover:border-pro-blue/30"
            title="Direct Site View"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-100 w-fit">
            <MapPin size={14} className="text-slate-400" />
            <span className="text-xs text-slate-600 font-medium truncate max-w-[120px]">{location}</span>
          </div>
          <div className="flex items-center gap-2 bg-pro-green/10 p-1.5 px-3 rounded-xl border border-pro-green/20 w-fit">
            <DollarSign size={14} className="text-pro-green" />
            <span className="text-xs text-pro-green font-bold truncate max-w-[120px]">{salary_extracted || 'TBD'}</span>
          </div>
        </div>

        {/* Status & Source */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
              {getSourceIcon(site)}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{site || 'Direct'}</span>
            </div>
          </div>
          {ats_score && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-pro-blue shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-[10px] text-pro-blue font-black tracking-widest uppercase">Score: {ats_score}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-100">
        <button 
          onClick={() => onOptimize?.(job.id)}
          className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          Optimize
        </button>
        <button 
          onClick={() => onApply?.(job.id)}
          className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <Send size={14} />
          Deploy
        </button>
      </div>

      <button 
        onClick={() => onGrowth?.(job.id)}
        className="w-full mt-3 py-3 rounded-xl border border-dashed border-pro-green/30 bg-pro-green/5 text-pro-green font-bold text-[10px] uppercase tracking-widest hover:bg-pro-green/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
      >
        <Zap size={12} className="group-hover:animate-pulse" />
        Unlock Growth Phase (Gap Analysis)
      </button>
    </div>
  );
};

export default JobCard;
