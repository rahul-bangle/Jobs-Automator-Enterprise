import React, { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import AgentStatusCounter from '../components/AgentStatusCounter';
import GrowthHubModal from '../components/GrowthHubModal';
import { api } from '../services/api';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('Associate Product Manager');
  const [location, setLocation] = useState('India');
  const [limit, setLimit] = useState(50);
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

        <div className="grid lg:grid-cols-[420px_1fr] gap-6 h-[calc(100vh-260px)] min-h-[620px]">
          <section className="rounded-2xl border border-[var(--outline-variant)] bg-white overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--outline-variant)] bg-[var(--primary)] text-white">
              <div className="font-semibold text-lg">{query} in India</div>
              <div className="text-sm opacity-90">{results.length} results</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!loading && results.length === 0 ? (
                <div className="p-6 text-sm text-[var(--secondary)]">No jobs yet. Press Launch to fetch roles.</div>
              ) : (
                results.map((job) => {
                  const isActive = selectedJob?.id === job.id;
                  return (
                    <button
                      type="button"
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`w-full text-left px-4 py-4 border-b border-[var(--outline-variant)] ${
                        isActive ? 'bg-blue-50 border-l-4 border-l-[var(--primary)] pl-3' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[var(--primary)] shrink-0">
                          {job.company_name?.charAt(0) || <Building2 size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-[var(--primary)] truncate">{job.job_title}</div>
                          <div className="text-base text-[var(--on-background)] truncate">{job.company_name || 'Unknown'}</div>
                          <div className="text-sm text-[var(--secondary)] truncate">{job.location || 'Location unavailable'}</div>
                          <div className="text-sm text-[var(--secondary)] mt-1">{job.site || 'Direct'}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[var(--outline-variant)] px-4 py-3 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold">1</button>
                <button className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-700 font-medium">2</button>
                <button className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-700 font-medium">3</button>
                <span className="px-1 text-slate-500">...</span>
              </div>
              <button className="text-sm font-semibold text-[var(--primary)] hover:underline">Next</button>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--outline-variant)] bg-white flex flex-col overflow-hidden">
            {selectedJob ? (
              <>
                <div className="p-6 border-b border-[var(--outline-variant)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center font-black text-2xl text-[var(--primary)]">
                        {selectedJob.company_name?.charAt(0) || 'J'}
                      </div>
                      <div>
                        <h2 className="text-4xl font-black leading-tight">{selectedJob.job_title}</h2>
                        <p className="text-lg text-[var(--secondary)] mt-1">
                          {selectedJob.company_name} {selectedJob.location ? `• ${selectedJob.location}` : ''}
                        </p>
                      </div>
                    </div>
                    {selectedJob.source_url ? (
                      <a
                        href={selectedJob.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--outline-variant)] px-4 py-2 text-[var(--primary)] font-semibold hover:bg-blue-50"
                      >
                        Open <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm bg-slate-50">
                      <MapPin size={14} /> {selectedJob.location || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm bg-slate-50">
                      <BriefcaseBusiness size={14} /> {selectedJob.site || 'Direct'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm bg-slate-50">
                      <Clock3 size={14} />
                      {selectedJob.discovery_date ? new Date(selectedJob.discovery_date).toLocaleString() : 'Recently discovered'}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[var(--outline-variant)] p-5">
                    <h3 className="text-2xl font-bold mb-2">About the job</h3>
                    <p className="text-base text-[var(--secondary)] whitespace-pre-wrap leading-relaxed">
                      {selectedJob.description || 'Description not available from current source. Use Open button to see full posting.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApply(selectedJob)}
                      className="rounded-2xl bg-[var(--primary)] text-white font-bold px-6 py-3 hover:bg-[var(--primary-container)]"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleOptimize(selectedJob)}
                      className="rounded-2xl border border-[var(--primary)] text-[var(--primary)] font-bold px-6 py-3 hover:bg-blue-50"
                    >
                      Analyze
                    </button>
                    <button
                      onClick={() => handleGrowth(selectedJob)}
                      className="rounded-2xl border border-[var(--outline-variant)] text-[var(--on-background)] font-bold px-6 py-3 hover:bg-slate-50"
                    >
                      Growth Plan
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-[var(--secondary)]">
                <div>
                  <div className="text-3xl font-semibold">No job selected</div>
                  <div className="text-base mt-2">Select a job from left panel to see details.</div>
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
