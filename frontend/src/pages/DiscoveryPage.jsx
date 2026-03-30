import React, { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  RefreshCw,
  Sparkles,
  History,
  RotateCcw
} from 'lucide-react';
import AgentStatusCounter from '../components/AgentStatusCounter';
import GrowthHubModal from '../components/GrowthHubModal';
import { api } from '../services/api';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('Associate Product Manager');
  const [location, setLocation] = useState('India');
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [activeAgents, setActiveAgents] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterRemote, setFilterRemote] = useState('all');
  const [filterJobType, setFilterJobType] = useState('all');
  const [filterDatePosted, setFilterDatePosted] = useState('any');
  const [filterExperience, setFilterExperience] = useState('all');

  const debounceRef = useRef(null);

  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl && import.meta.env.PROD) {
      throw new Error('VITE_API_URL is required in production environment.');
    }
    return envUrl || 'http://127.0.0.1:8001';
  };

  const API_URL = getApiUrl();

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/api/v2/jobs/suggest?q=${encodeURIComponent(q)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Suggestions fetch error:', err);
    }
  };

  const fetchJobsFromDb = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/v2/jobs`);
      if (!resp.ok) return;
      const data = await resp.json();
      const rows = Array.isArray(data) ? data : [];
      setResults(rows);
      if (rows.length > 0) {
        setSelectedJob(rows[0]);
        setStatus(`Loaded ${rows.length} jobs from database.`);
      }
    } catch (err) {
      console.error('Jobs fetch error:', err);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    setLoading(true);
    setResults([]);
    setSelectedJob(null);
    setStatus(`Searching "${query}" in ${location}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    let finalCount = 0;

    try {
      const response = await fetch(`${API_URL}/api/v2/jobs/discovery?query=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [location],
          filters: {
            remote: filterRemote,
            job_type: filterJobType,
            date_posted: filterDatePosted,
            experience: filterExperience,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`API failed: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const job = JSON.parse(line);
            setResults((prev) => {
              const updated = prev.find((j) => j.id === job.id) ? prev : [...prev, job];
              if (!selectedJob && updated.length > 0) {
                setSelectedJob(updated[0]);
              }
              finalCount = updated.length;
              setStatus(`Discovery in progress... Found ${finalCount} roles.`);
              return updated;
            });
          } catch (err) {
            console.error('Chunk parse error:', err);
          }
        }
      }

      if (finalCount > 0) {
        setStatus(`Discovery complete. ${finalCount} roles loaded.`);
      } else {
        setStatus('Discovery complete. No matching roles found.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('Discovery timed out or was cancelled.');
      } else {
        console.error(err);
        setStatus('Operational error in discovery stream.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsFromDb();
  }, []);

  useEffect(() => {
    if (!selectedJob && results.length > 0) {
      setSelectedJob(results[0]);
    }
  }, [results, selectedJob]);

  const handleOptimize = async (job) => {
    setActiveAgents(['analyst', 'tailor']);
    setStatus(`Optimizing for ${job.company_name}...`);
    try {
      const data = await api.optimize(job.id);
      setStatus(`Optimization complete! Score: ${data.score}%`);
    } catch (err) {
      console.error(err);
      setStatus('Optimization failed.');
    } finally {
      setActiveAgents([]);
    }
  };

  const handleApply = async (job) => {
    setActiveAgents(['analyst', 'tailor', 'closer']);
    setStatus(`Applying to ${job.company_name}...`);
    try {
      const data = await api.apply(job.id);
      if (data.status === 'completed') {
        setStatus(`Application submitted: ${data.orchestration_data.submission.message}`);
      } else {
        setStatus(`Application: ${data.status}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('Apply failed.');
    } finally {
      setActiveAgents([]);
    }
  };

  const handleGrowth = async (job) => {
    setActiveAgents(['analyst']);
    setLoading(true);
    setStatus('Building growth plan...');
    try {
      const data = await api.generateGrowthPlan(job.id);
      setSelectedJob(job);
      setSelectedPlan(data);
      setStatus('Growth plan ready.');
    } catch (err) {
      console.error(err);
      setStatus('Growth analysis failed.');
    } finally {
      setLoading(false);
      setActiveAgents([]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)]">
      <div className="max-w-[1500px] mx-auto px-6 py-4 space-y-4">
        <div className="rounded-2xl bg-white border border-[var(--outline-variant)] p-3">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <input
                value={query}
                onChange={handleQueryChange}
                onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                placeholder="Search roles"
                className="w-full rounded-xl bg-[var(--surface-container-low)] px-4 py-3 text-base font-semibold border border-transparent focus:border-[var(--primary)] focus:bg-white outline-none"
              />
              {showSuggestions && suggestions.length > 0 ? (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[var(--outline-variant)] bg-white shadow-xl z-40 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-[var(--outline-variant)] last:border-b-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="md:col-span-4">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-[var(--surface-container-low)] px-4 py-3 font-semibold border border-transparent focus:border-[var(--primary)] focus:bg-white outline-none"
              >
                <option value="India">India</option>
                <option value="India (All)">India (All)</option>
                <option value="Remote, India">Remote (India)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                disabled={loading}
                className="w-full h-full rounded-xl bg-[var(--primary)] text-white font-black tracking-wide hover:bg-[var(--primary-container)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Launch
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterRemote}
            onChange={(e) => setFilterRemote(e.target.value)}
            className="rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)] px-3 py-2 text-sm text-[var(--on-background)]"
          >
            <option value="all">Remote: All</option>
            <option value="remote">Remote only</option>
            <option value="onsite">On-site only</option>
          </select>
          <select
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            className="rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)] px-3 py-2 text-sm text-[var(--on-background)]"
          >
            <option value="all">Job type: All</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          <select
            value={filterDatePosted}
            onChange={(e) => setFilterDatePosted(e.target.value)}
            className="rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)] px-3 py-2 text-sm text-[var(--on-background)]"
          >
            <option value="any">Date posted: Any</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past 7 days</option>
            <option value="30d">Past 30 days</option>
          </select>
          <select
            value={filterExperience}
            onChange={(e) => setFilterExperience(e.target.value)}
            className="rounded-lg bg-[var(--surface-container-low)] border border-[var(--outline-variant)] px-3 py-2 text-sm text-[var(--on-background)]"
          >
            <option value="all">Experience: All</option>
            <option value="fresher">Fresher</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
          {status ? (
            <div className="ml-auto px-3 py-2 rounded-full border border-[var(--outline-variant)] bg-[var(--primary)]/5 text-[var(--primary)] text-sm">
              {status}
            </div>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 h-[calc(100vh-160px)] min-h-[820px] items-stretch">
          <section className="rounded-2xl border border-[var(--outline-variant)] bg-white overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--outline-variant)] bg-[var(--primary)] text-white">
              <div className="font-semibold text-lg">{query} in India</div>
              <div className="text-sm opacity-90">{results.length} results</div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <div className="px-5 py-4 border-b border-[var(--outline-variant)] bg-white/80 backdrop-blur-sm flex items-center justify-between">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Opportunity Stream</div>
                <div className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-200">
                  {results.length} ACTIVE
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {!loading && results.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                       <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">System ready. Initialize discovery to populate feed.</p>
                  </div>
                ) : (
                  results.map((job) => {
                    const isActive = selectedJob?.id === job.id;
                    return (
                      <button
                        type="button"
                        key={job.id}
                        onClick={async () => {
                          setSelectedJob(job);
                          if (!job.description) {
                            try {
                              const resp = await fetch(`${API_URL}/api/v2/jobs/${job.id}/sync`, { method: 'POST' });
                              if (resp.ok) {
                                const data = await resp.json();
                                // Update the job in the local results list and selectedJob
                                setResults(prev => prev.map(j => j.id === job.id ? { ...j, description: data.description } : j));
                                setSelectedJob(prev => prev?.id === job.id ? { ...prev, description: data.description } : prev);
                              }
                            } catch (err) {
                              console.error("Sync failed:", err);
                            }
                          }
                        }}
                        className={`w-full text-left p-5 transition-all border-b border-slate-100 relative group ${
                          isActive ? 'bg-white shadow-[inset_4px_0_0_0_#2563eb] ring-1 ring-black/[0.02]' : 'hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border transition-all ${
                            isActive ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            {job.company_name?.charAt(0) || <Building2 size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[0.95rem] font-black truncate leading-tight mb-1 ${
                              isActive ? 'text-blue-600' : 'text-slate-800'
                            }`}>{job.job_title}</div>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-slate-500 truncate">{job.company_name}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{job.location}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </div>
          </section>

          <section className="rounded-3xl border border-[var(--outline-variant)] bg-white flex flex-col overflow-hidden">
            {selectedJob ? (
              <div className="flex flex-col h-full">
                {/* Header: Simplified - removed gradient and shadow */}
                <div className="p-6 border-b border-slate-100 relative bg-white">
                  <div className="absolute top-6 right-6">
                    <div className="flex gap-2">
                       {selectedJob.source_url && (
                          <a
                            href={selectedJob.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 text-xs font-black hover:bg-slate-50 transition-all active:scale-95"
                          >
                            Open Posting <ExternalLink size={14} />
                          </a>
                       )}
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-3xl font-black text-blue-600">
                      {selectedJob.company_name?.charAt(0) || 'J'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="px-2 py-0.5 rounded-md bg-blue-600 text-[9px] font-black text-white uppercase tracking-widest">Active Analysis</span>
                         <span className="text-[10px] font-bold text-slate-400">ID: {selectedJob.id?.substring(0, 12)}...</span>
                      </div>
                      <h2 className="text-2xl font-black leading-snug tracking-tight text-slate-900 mb-1">{selectedJob.job_title}</h2>
                      <div className="flex items-center gap-2.5">
                        <p className="text-base font-bold text-blue-600">{selectedJob.company_name}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-100"></span>
                        <p className="text-sm font-bold text-slate-400">{selectedJob.location || 'Location Pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="flex flex-wrap gap-2.5">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-blue-50 px-3 py-1.5 text-[11px] font-black bg-blue-50/50 text-blue-700">
                        <MapPin size={14} /> {selectedJob.location || 'Remote Selection'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-1.5 text-[11px] font-black bg-slate-50 text-slate-600">
                        <BriefcaseBusiness size={14} /> {selectedJob.site || 'Indeed'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-1.5 text-[11px] font-black bg-slate-50 text-slate-600">
                        <Clock3 size={14} />
                        {selectedJob.discovery_date ? new Date(selectedJob.discovery_date).toLocaleDateString() : 'Market Opportunity'}
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                           <h3 className="text-lg font-black text-slate-900 tracking-tight">Requirement Overview</h3>
                           <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        {/* 
                          Main Content Zone: 
                          Ensuring text-base scaling and a high-visibility text-slate-800 color.
                        */}
                        <div className="text-base text-slate-800 whitespace-pre-wrap leading-relaxed font-medium tracking-tight">
                          {selectedJob.description || selectedJob.fit_summary || (
                             <div className="flex flex-col gap-3">
                                <span className="text-slate-400 italic font-normal">Extracting deep-context requirements...</span>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold leading-relaxed">
                                  PRO TIP: If the description is blank, use "Launch Engine" to view the live posting while our AI finishes parsing the local cache.
                                </div>
                             </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Competency Matrix: Reclaimed vertical space */}
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 bg-slate-50/20">
                        <div className="flex items-center justify-between mb-3">
                           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Competency Matrix</h4>
                           <Sparkles size={12} className="text-blue-400" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                           {(selectedJob.study_guide?.learning_subjects || ['Strategic Growth', 'Systemic Thinking', 'Technical Leadership', 'Data Ops']).map((s, idx) => (
                             <span key={idx} className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                               {s}
                             </span>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 
                    Fixed Action Hub Footer: 
                    Strong visual boundary with top-border and subtle drop shadow 
                  */}
                  <div className="p-4 bg-white border-t-2 border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="rounded-xl border border-blue-100 p-3 bg-blue-50/30 shadow-sm ring-1 ring-blue-50 transition-all hover:bg-blue-50">
                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Match Grade</div>
                        <div className="text-xl font-black text-blue-700 leading-none">
                           {selectedJob.relevance_score || 0}<span className="text-xs text-blue-300 ml-0.5">%</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 bg-white shadow-sm hover:border-slate-300 transition-all">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Node</div>
                        <div className="text-[11px] font-black text-slate-800 truncate leading-none uppercase">
                           {selectedJob.site || 'External'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 bg-white shadow-sm">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID_REF</div>
                        <div className="text-[9px] font-mono font-bold text-slate-400 truncate leading-none">
                           {selectedJob.id?.substring(0, 8)}...
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3 bg-white shadow-sm">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PKG_EST</div>
                        <div className="text-[11px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block leading-none">
                           {selectedJob.salary_extracted || 'TBD'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-3">
                      <button
                        onClick={() => handleApply(selectedJob)}
                        className="flex-[1.8] rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                      >
                        Launch Engine <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleOptimize(selectedJob)}
                        className="flex-1 rounded-xl border border-blue-600 text-blue-600 font-black text-[10px] uppercase tracking-widest px-4 py-3.5 hover:bg-blue-50 transition-all active:scale-[0.98]"
                      >
                        Tune
                      </button>
                      <button
                        onClick={() => handleGrowth(selectedJob)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest px-4 py-3.5 hover:bg-slate-50 transition-all active:scale-[0.98]"
                      >
                        Skills
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-300 p-10">
                <div>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Search className="text-slate-100" size={32} />
                  </div>
                  <div className="text-xl font-black text-slate-700 tracking-tight">No Selection</div>
                  <div className="text-sm font-medium mt-1">Select a role to initialize analysis.</div>
                </div>
              </div>
            )}
          </section>
        </div>

        <AgentStatusCounter activeAgents={activeAgents} batchProgress={batchProgress} />
        <GrowthHubModal
          isOpen={!!selectedPlan}
          onClose={() => {
            setSelectedPlan(null);
            setSelectedJob(null);
          }}
          growthData={selectedPlan}
          jobTitle={selectedJob?.job_title}
        />
      </div>
    </div>
  );
}
