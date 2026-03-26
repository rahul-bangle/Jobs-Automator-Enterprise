export const API_BASE_URL = 'http://localhost:8001/api/v1';

export const api = {
  async getInitialState() {
    // For now, we mix real and mock data to ensure a smooth transition
    // In a full implementation, this hits /jobs, /campaign, etc.
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
    // Push the accepted jobs to the backend
    const response = await fetch(`${API_BASE_URL}/imports/csv`, { // Re-using CSV logic or similar for batch
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
    const response = await fetch(`${API_BASE_URL}/v2/growth/${jobId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to generate growth plan');
    return await response.json();
  },

  async discovery(query, location, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/v2/jobs/discovery?query=${query}&limit=${limit}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([location])
    });
    if (!response.ok) throw new Error('Discovery failed');
    return await response.json();
  },

  async optimize(jobId) {
    const response = await fetch(`${API_BASE_URL}/v2/optimize/${jobId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Optimization failed');
    return await response.json();
  },

  async apply(jobId) {
    const response = await fetch(`${API_BASE_URL}/v2/apply/${jobId}`, {
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
