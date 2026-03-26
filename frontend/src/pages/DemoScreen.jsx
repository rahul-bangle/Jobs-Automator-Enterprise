import React, { useState, useEffect } from 'react';
import { Download, Zap, Building2, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const DemoScreen = () => {
  const [jobId, setJobId] = useState('9818d8bcc8be7ad3d23847839e810961717f85a48cee01cfdd472426b633e50f');
  const [jobData, setJobData] = useState(null);
  const [optimized, setOptimized] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchJob = async () => {
    try {
      const data = await api.fetchDemoJob(jobId);
      setJobData(data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const data = await api.optimizeDemo({
        job_id: jobId,
        description: jobData.description,
        job_title: jobData.job_title
      });
      setOptimized(data);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center glass p-6 rounded-2xl border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="text-accent-primary fill-accent-primary" size={24} />
            Optimization Demo
          </h1>
          <p className="text-secondary text-sm font-mono uppercase tracking-widest">TailorEngineV2 Live</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={jobId} 
            onChange={(e) => setJobId(e.target.value)}
            className="px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm w-64 focus:ring-2 focus:ring-accent-primary transition-all outline-none text-primary"
            placeholder="Enter Job ID..."
          />
          <button 
            onClick={fetchJob}
            className="btn-primary px-6 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Fetch Job
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Job Details */}
        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl lg:h-[700px] flex flex-col">
          {jobData ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-accent-primary font-bold text-sm tracking-widest uppercase">
                  <Building2 size={16} />
                  {jobData.company_name}
                </div>
                <h2 className="text-4xl font-extrabold text-primary tracking-tight">{jobData.job_title}</h2>
                <div className="flex items-center gap-4 text-secondary font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={16} /> {jobData.location}</span>
                  <span className="flex items-center gap-1.5"><ExternalLink size={16} /> {jobData.site}</span>
                </div>
              </div>
              
              <div className="pt-8 mt-8 border-t border-white/5 flex-grow overflow-hidden flex flex-col">
                <h3 className="font-bold text-primary mb-4 text-xl flex items-center gap-2">
                  <Sparkles size={20} className="text-accent-primary" />
                  Target Requirements
                </h3>
                <div className="prose prose-invert max-w-none text-secondary text-sm overflow-y-auto pr-4 scrollbar-thin flex-grow font-mono leading-relaxed">
                  {jobData.description}
                </div>
              </div>

              <button 
                onClick={handleOptimize}
                disabled={loading}
                className="w-full btn-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 mt-8 shadow-xl"
              >
                {loading ? <Sparkles className="animate-spin" /> : <Zap size={24} />}
                {loading ? 'ANALYZING & TAILORING...' : 'OPTIMIZE MATCH SCORE'}
              </button>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-secondary space-y-4">
              <Building2 size={64} className="opacity-10 animate-pulse" />
              <p className="font-mono tracking-widest uppercase text-xs">Awaiting Job Data Integration</p>
            </div>
          )}
        </div>

        {/* Right Col: Optimized Result */}
        <div className="glass-dark rounded-3xl p-8 shadow-2xl relative overflow-hidden group border border-accent-primary/20 lg:h-[700px] flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={250} className="text-accent-primary" />
            </div>
            
            <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                <Sparkles className="text-accent-primary" size={28} />
                AI Optimization Output
            </h3>

            {optimized ? (
              <div className="space-y-6 relative flex flex-col flex-grow">
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 flex-grow overflow-hidden flex flex-col shadow-inner">
                    <pre className="text-accent-primary/90 text-[11px] font-mono overflow-y-auto scrollbar-thin flex-grow selection:bg-accent-primary selection:text-black">
                        {JSON.stringify(optimized.final_resume, null, 2)}
                    </pre>
                </div>
                <div className="flex justify-between items-center text-primary/60 text-xs font-mono tracking-widest uppercase border-t border-white/5 pt-4">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                      ATS MATCH: {optimized.best_score}%
                    </span>
                    <span>ITR: {optimized.version_history.length}</span>
                </div>
              </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-secondary/30 border-2 border-dashed border-white/5 rounded-3xl font-mono text-sm">
                    <p className="animate-pulse">Waiting for recursive loop execution...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DemoScreen;
