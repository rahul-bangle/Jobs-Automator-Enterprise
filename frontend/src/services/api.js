const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl && import.meta.env.PROD) {
    throw new Error("VITE_API_URL is required in production environment.");
  }
  return envUrl || 'http://127.0.0.1:8001';
};

export const API_BASE_URL = `${getApiUrl()}/api/v1`;
const API_V2_URL = `${getApiUrl()}/api/v2`;

export const api = {
  async getInitialState() {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error('Failed to fetch initial state');
    const jobs = await response.json();
    return { jobs };
  },

  async previewImport({ urls, fileName }) {
    const response = await fetch(`${API_BASE_URL}/imports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, fileName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to preview import');
    }
    
    return await response.json();
  },

  async confirmImportBatch(preview) {
    const response = await fetch(`${API_BASE_URL}/imports/csv`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(preview.rows.filter(r => r.queueStatus === 'accepted')),
    });
    return await response.json();
  },

  async optimizeResume(jobId) {
    const response = await fetch(`${API_BASE_URL}/intelligence/optimize-resume/${jobId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to optimize resume');
    return await response.json();
  },

  async fetchStudyGuide(jobId) {
    const response = await fetch(`${API_BASE_URL}/intelligence/study-guide/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch study guide');
    return await response.json();
  },

  async generateGrowthPlan(jobId) {
    const response = await fetch(`${API_V2_URL}/growth/${jobId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to generate growth plan');
    return await response.json();
  },

  async discovery(query, location, limit = 10) {
    const response = await fetch(`${API_V2_URL}/jobs/discovery?query=${query}&limit=${limit}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [location] })
    });
    if (!response.ok) throw new Error('Discovery failed');
    return await response.json();
  },

  async optimize(jobId) {
    const response = await fetch(`${API_V2_URL}/optimize/${jobId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Optimization failed');
    return await response.json();
  },

  async apply(jobId) {
    const response = await fetch(`${API_V2_URL}/apply/${jobId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Application deployment failed');
    return await response.json();
  },

  async fetchDemoJob(jobId) {
    const response = await fetch(`${API_BASE_URL}/demo/job/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch demo job');
    return await response.json();
  },

  async optimizeDemo(payload) {
    const response = await fetch(`${API_BASE_URL}/demo/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Demo optimization failed');
    return await response.json();
  }
};
