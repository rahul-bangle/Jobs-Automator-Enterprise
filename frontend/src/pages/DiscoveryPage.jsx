import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Loader2 } from 'lucide-react';
import JobsFeed from '../components/JobsFeed';
import AgentStatusCounter from '../components/AgentStatusCounter';
import GrowthHubModal from '../components/GrowthHubModal';
import { api } from '../services/api';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('Full Stack Developer');
  const [location, setLocation] = useState('Hyderabad, Telangana, India');
  const [limit, setLimit] = useState(20);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 no-scrollbar relative">
      {/* Search Header */}
      <div className="pro-glass-card p-8 bg-white/40 border-slate-200/60 shadow-xl shadow-slate-200/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pro-blue/10 rounded-2xl shadow-inner">
            <Search className="w-6 h-6 text-pro-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Autonomous Discovery</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">Multi-site aggregation powered by agentic loops</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-50">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pro-blue transition-colors" />
            <input
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query.length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
              placeholder="Target Role (e.g. Product Manager)"
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-white/80 focus:ring-4 focus:ring-pro-blue/10 focus:border-pro-blue outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-900/5">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3">Agent Suggestions</span>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-pro-blue/10 hover:text-pro-blue transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3"
                  >
                    <Sparkles className="w-3 h-3 opacity-40" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pro-blue transition-colors" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-10 py-4 rounded-2xl border border-slate-200 bg-white/80 focus:ring-4 focus:ring-pro-blue/10 focus:border-pro-blue outline-none transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="Hyderabad, Telangana, India">Hyderabad (All)</option>
              <option value="Hitech City, Hyderabad">Hitech City</option>
              <option value="Gachibowli, Hyderabad">Gachibowli</option>
            </select>
          </div>
          <button
            disabled={loading}
            className="pro-btn bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-tighter"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Discovering...' : 'Launch Pipeline'}
          </button>
        </form>

        {status && (
          <div className="mt-6 flex items-center gap-2 text-sm font-black text-pro-blue bg-pro-blue/5 p-4 rounded-xl border border-pro-blue/10 animate-in slide-in-from-left-4 duration-500">
            <div className="w-2 h-2 rounded-full bg-pro-blue animate-pulse" />
            {status}
          </div>
        )}
      </div>

      {/* Discovery Feed */}
      <div className="overflow-hidden rounded-3xl">
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
  );
}
