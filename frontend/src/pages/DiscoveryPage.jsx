import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Loader2 } from 'lucide-react';
import JobsFeed from '../components/JobsFeed';
import AgentStatusCounter from '../components/AgentStatusCounter';
import GrowthHubModal from '../components/GrowthHubModal';
import { api } from '../services/api';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('Full Stack Developer');
  const [location, setLocation] = useState('Hyderabad, Telangana, India');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const [activeAgents, setActiveAgents] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl && import.meta.env.PROD) {
      throw new Error("VITE_API_URL is required in production environment.");
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
      console.error("Suggestions fetch error:", err);
    }
  };

  // Improved Debounce
  const debounceRef = useRef(null);
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
    setStatus(`Searching Global Tech Hubs for "${query}" (Refining search terms)...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let finalCount = 0;
    
    try {
      // Use standard fetch for streaming support
      const response = await fetch(`${API_URL}/api/v2/jobs/discovery?query=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: [location] }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`API failed: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log(`🚀 Discovery stream started: ${query} in ${location}`);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log(`📦 Received chunk (${chunk.length} chars)`);
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const job = JSON.parse(line);
            console.log(`✅ Parsed Job: [${job.site || 'N/A'}] ${job.job_title} @ ${job.company_name}`);
            
            setResults(prev => {
              const updated = prev.find(j => j.id === job.id) ? prev : [...prev, job];
              finalCount = updated.length;
              setStatus(`Discovery in progress... Found ${finalCount} roles.`);
              return updated;
            });
          } catch (err) {
            console.error("❌ Chunk parse error:", err, "Line:", line);
          }
        }
      }
      
      console.log(`🏁 Discovery finished. Total unique jobs: ${finalCount}`);
      if (finalCount > 0) {
        setStatus(`Discovery complete. Analysis ready for ${finalCount} roles.`);
      } else {
        setStatus('Discovery complete. No new matching roles found in this cycle.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('Discovery timed out or was cancelled.');
      } else {
        console.error(err);
        setStatus('Operational error in Streamed Discovery Pipeline.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const onToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchApply = async () => {
    setActiveAgents(['analyst', 'tailor', 'closer']);
    setBatchProgress({ current: 0, total: selectedIds.length });
    setStatus(`Initiating Batch Deployment for ${selectedIds.length} jobs...`);
    
    try {
      // Small delay per job to simulate/allow UI to update if we had granular callbacks
      // For now, we hit the batch endpoint
      const data = await api.batchApply(selectedIds);
      setBatchProgress({ current: selectedIds.length, total: selectedIds.length });
      setStatus(`Batch Complete! Success: ${data.success}, Failed: ${data.failed}`);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setStatus('Batch deployment failed.');
    } finally {
      setTimeout(() => {
        setActiveAgents([]);
        setBatchProgress(null);
      }, 3000);
    }
  };

  const handleOptimize = async (job) => {
    setActiveAgents(['analyst', 'tailor']);
    setStatus(`Orchestrating Optimization for ${job.company_name}...`);
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
    setStatus(`Autonomous Deploy Chain active for ${job.company_name}...`);
    try {
      const data = await api.apply(job.id);
      if (data.status === 'completed') {
        setStatus(`Deployment Successful! ${data.orchestration_data.submission.message}`);
      } else {
        setStatus(`Deployment: ${data.status} - ${data.message || data.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('Deployment failed.');
    } finally {
      setActiveAgents([]);
    }
  };

  const handleGrowth = async (job) => {
    setActiveAgents(['analyst']);
    setStatus(`Analyzing tech gaps...`);
    setLoading(true);
    try {
      const data = await api.generateGrowthPlan(job.id);
      setSelectedJob(job);
      setSelectedPlan(data);
      setStatus(`Growth plan ready.`);
    } catch (err) {
      console.error(err);
      setStatus('Growth analysis failed.');
    } finally {
      setLoading(false);
      setActiveAgents([]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)] font-['Inter'] selection:bg-[var(--primary)] selection:text-white no-scrollbar">
      {/* Precision Header: Glassmorphism + Backdrop Blur */}
      <div className="sticky top-0 z-[100] w-full backdrop-blur-[20px] bg-white/70 border-b border-[var(--outline-variant)] px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 rounded-2xl">
            <Search className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1">Discovery Console</h1>
            <p className="text-[var(--secondary)] text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">The Precision Architect — v2.1</p>
          </div>
        </div>
        
        {status && (
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/5 px-5 py-2.5 rounded-full border border-[var(--outline-variant)] animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            {status}
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-12">
        {/* Search Workspace: Asymmetrical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="no-line-card p-10 shadow-2xl shadow-blue-900/5 bg-white relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)] opacity-20 group-hover:opacity-100 transition-opacity" />
              
              <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">
                Synthesize Your Next <br />
                <span className="text-[var(--primary)]">Career Milestone.</span>
              </h2>

              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                <div className="md:col-span-7 relative group">
                  <input
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                    placeholder="Search roles (e.g. Lead Engineer)"
                    className="w-full pl-6 pr-4 py-5 rounded-2xl bg-[var(--surface-container-low)] border border-transparent focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5 outline-none transition-all font-semibold text-lg"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-[var(--outline-variant)] rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)]/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] px-3">Agentic Insights</span>
                      </div>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setQuery(s);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-6 py-4 text-sm font-bold text-[var(--on-background)] hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] transition-colors flex items-center gap-3 border-b border-[var(--outline-variant)] last:border-0"
                        >
                          <Sparkles className="w-4 h-4 opacity-30" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-3 relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-6 py-5 rounded-2xl bg-[var(--surface-container-low)] border border-transparent focus:bg-white focus:border-[var(--primary)] outline-none transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="Hyderabad, India">Hyderabad</option>
                    <option value="Bangalore, India">Bangalore</option>
                    <option value="Remote">Remote (India)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    disabled={loading}
                    className="w-full h-full rounded-2xl bg-[var(--primary)] text-white font-black uppercase tracking-tighter hover:bg-[var(--primary-container)] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Launch
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="no-line-card p-8 bg-[var(--surface-container-low)] border-none">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-50">Active Filters</h3>
              <div className="flex flex-wrap gap-2">
                {['Direct Hire', 'Full-time', 'Enterprise', 'Top Tier'].map(f => (
                  <span key={f} className="px-4 py-2 rounded-xl bg-white text-[10px] font-bold text-[var(--on-background)] shadow-sm">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="no-line-card p-8 bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70">Pipeline Control</p>
              <p className="text-xl font-bold leading-tight mb-4">Deep Scrape Automation active across 4 sources.</p>
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: loading ? '60%' : '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Workspace */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Discovery Feed <span className="text-[var(--secondary)] opacity-40 ml-2">/ {results.length} results</span></h3>
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBatchApply}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-4"
              >
                Deploy Batch ({selectedIds.length})
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <JobsFeed 
              jobs={results} 
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onBatchApply={handleBatchApply}
              onOptimize={handleOptimize}
              onApply={handleApply}
              onGrowth={handleGrowth}
            />
          </div>
        </div>

        <AgentStatusCounter 
          activeAgents={activeAgents} 
          batchProgress={batchProgress}
        />
        
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
