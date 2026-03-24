const API_BASE_URL = 'http://localhost:8001/api/v1';

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
  }
};
