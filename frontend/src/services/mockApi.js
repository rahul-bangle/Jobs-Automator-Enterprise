import {
  initialApplicationPackets,
  initialCampaign,
  initialImportBatches,
  initialJobs,
  initialResumeVariants,
  initialSubmissionAttempts,
} from '../data/mockData.js';

const STORAGE_KEY = 'job_automator_production_v1';

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const clone = (value) => JSON.parse(JSON.stringify(value));

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const loadState = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const seed = {
    campaign: initialCampaign,
    importBatches: initialImportBatches,
    jobs: initialJobs,
    resumeVariants: initialResumeVariants,
    applicationPackets: initialApplicationPackets,
    submissionAttempts: initialSubmissionAttempts,
    settings: {
      supabaseConfigured: false,
      sqliteFallbackEnabled: true,
      darkModeLocked: true,
      autoOpenManualSteps: true,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
};

const buildPreviewRows = ({ urls, fileName }) => {
  const rows = [];
  const list = urls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);

  list.forEach((url, index) => {
    const normalized = slugify(url);
    let queueStatus = 'review';
    let trustScore = 62;
    let relevanceScore = 80;
    let source = 'Manual URL';
    let companyName = normalized.split('-')[0] || `Company ${index + 1}`;
    let jobTitle = 'Product Manager';

    if (url.includes('greenhouse')) {
      queueStatus = 'accepted';
      trustScore = 90;
      relevanceScore = 93;
      source = 'Greenhouse';
      jobTitle = 'Assistant Product Manager';
    } else if (url.includes('lever')) {
      queueStatus = 'accepted';
      trustScore = 88;
      relevanceScore = 89;
      source = 'Lever';
      jobTitle = 'Associate Product Manager';
    } else if (url.includes('ashby')) {
      queueStatus = 'review';
      trustScore = 82;
      relevanceScore = 79;
      source = 'Ashby';
      jobTitle = 'Product Analyst';
    } else if (url.includes('linkedin')) {
      queueStatus = 'review';
      trustScore = 58;
      relevanceScore = 74;
      source = 'LinkedIn';
      jobTitle = 'APM Discovery Link';
    } else if (url.includes('notion') || url.includes('google')) {
      queueStatus = 'rejected';
      trustScore = 28;
      relevanceScore = 50;
      source = 'Unknown';
      jobTitle = 'Unverified Listing';
    }

    rows.push({
      id: `preview-${index + 1}`,
      companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
      jobTitle,
      source,
      sourceUrl: url,
      location: index % 2 === 0 ? 'Bengaluru' : 'Remote',
      trustScore,
      relevanceScore,
      queueStatus,
      duplicate: false,
      validationError: '',
    });
  });

  if (fileName) {
    rows.push({
      id: `preview-file-${slugify(fileName)}`,
      companyName: 'Imported Spreadsheet Co',
      jobTitle: 'Product Operations Analyst',
      source: 'Spreadsheet',
      sourceUrl: '',
      location: 'Pune',
      trustScore: 76,
      relevanceScore: 68,
      queueStatus: 'review',
      duplicate: false,
      validationError: 'Needs manual verification because row came from file-only upload.',
    });
  }

  return rows;
};

const createPacketForJob = (state, jobId) => {
  if (state.applicationPackets.some((packet) => packet.jobId === jobId)) return state.applicationPackets;
  const bestResume = [...state.resumeVariants].sort((a, b) => b.matchScore - a.matchScore)[0];
  return [
    ...state.applicationPackets,
    {
      id: `packet-${jobId}`,
      jobId,
      resumeVariantId: bestResume.id,
      approvalStatus: 'ready',
      warnings: [],
      fitReasons: ['Approved from trusted/review queue'],
    },
  ];
};

export const mockApi = {
  async getInitialState() {
    return delay(clone(loadState()));
  },
  async saveCampaign(nextCampaign) {
    const state = loadState();
    state.campaign = { ...state.campaign, ...nextCampaign };
    saveState(state);
    return delay(clone(state.campaign));
  },
  async previewImportFile({ fileName = '', urls = '' }) {
    const rows = buildPreviewRows({ urls, fileName });
    return delay({
      fileName,
      rows,
      summary: {
        accepted: rows.filter((row) => row.queueStatus === 'accepted').length,
        review: rows.filter((row) => row.queueStatus === 'review').length,
        rejected: rows.filter((row) => row.queueStatus === 'rejected').length,
        duplicates: rows.filter((row) => row.duplicate).length,
      },
    });
  },
  async confirmImportBatch(preview) {
    const state = loadState();
    const createdAt = new Date().toISOString();
    const newJobs = preview.rows.map((row, index) => ({
      id: `job-imported-${Date.now()}-${index}`,
      companyName: row.companyName,
      jobTitle: row.jobTitle,
      source: row.source,
      sourceUrl: row.sourceUrl,
      location: row.location,
      trustScore: row.trustScore,
      relevanceScore: row.relevanceScore,
      queueStatus: row.queueStatus,
      atsType: row.source.toLowerCase(),
      fitSummary:
        row.queueStatus === 'accepted'
          ? 'Imported as high-confidence job from trusted or semi-trusted source.'
          : 'Imported for review because source quality or relevance needs confirmation.',
      riskFlags: row.validationError ? [row.validationError] : [],
      createdAt,
    }));

    state.jobs = [...newJobs, ...state.jobs];
    newJobs.forEach((job) => {
      if (job.queueStatus === 'accepted') {
        state.applicationPackets = createPacketForJob(state, job.id);
      }
    });
    state.importBatches = [
      {
        id: `batch-${Date.now()}`,
        createdAt,
        sourceType: preview.fileName ? 'CSV/XLSX + URLs' : 'URL Paste',
        fileName: preview.fileName || 'manual-url-batch',
        totalRows: preview.rows.length,
        acceptedRows: preview.summary.accepted,
        reviewRows: preview.summary.review,
        rejectedRows: preview.summary.rejected,
      },
      ...state.importBatches,
    ];
    saveState(state);
    return delay(clone(state));
  },
  async approveReviewItem(jobId) {
    const state = loadState();
    state.jobs = state.jobs.map((job) =>
      job.id === jobId ? { ...job, queueStatus: 'accepted', riskFlags: job.riskFlags.filter((flag) => flag !== 'Snoozed for later review') } : job,
    );
    state.applicationPackets = createPacketForJob(state, jobId);
    saveState(state);
    return delay(clone(state));
  },
  async rejectReviewItem(jobId) {
    const state = loadState();
    state.jobs = state.jobs.map((job) => (job.id === jobId ? { ...job, queueStatus: 'rejected' } : job));
    saveState(state);
    return delay(clone(state));
  },
  async snoozeReviewItem(jobId) {
    const state = loadState();
    state.jobs = state.jobs.map((job) =>
      job.id === jobId ? { ...job, queueStatus: 'snoozed', riskFlags: [...job.riskFlags.filter((flag) => flag !== 'Snoozed for later review'), 'Snoozed for later review'] } : job,
    );
    saveState(state);
    return delay(clone(state));
  },
  async markDuplicate(jobId) {
    const state = loadState();
    state.jobs = state.jobs.map((job) => (job.id === jobId ? { ...job, queueStatus: 'duplicate' } : job));
    saveState(state);
    return delay(clone(state));
  },
  async approveApplicationPacket(packetId) {
    const state = loadState();
    state.applicationPackets = state.applicationPackets.map((packet) => (packet.id === packetId ? { ...packet, approvalStatus: 'approved' } : packet));
    const packet = state.applicationPackets.find((item) => item.id === packetId);
    const job = state.jobs.find((item) => item.id === packet?.jobId);
    if (packet && job) {
      state.submissionAttempts = [
        {
          id: `submission-${Date.now()}`,
          packetId,
          companyName: job.companyName,
          jobTitle: job.jobTitle,
          source: job.source,
          timestamp: new Date().toISOString(),
          outcome: 'approved',
          failureReason: '',
        },
        ...state.submissionAttempts,
      ];
    }
    saveState(state);
    return delay(clone(state));
  },
  async setPacketResumeVariant(packetId, resumeVariantId) {
    const state = loadState();
    state.applicationPackets = state.applicationPackets.map((packet) => (packet.id === packetId ? { ...packet, resumeVariantId } : packet));
    saveState(state);
    return delay(clone(state));
  },
  async saveSettings(nextSettings) {
    const state = loadState();
    state.settings = { ...state.settings, ...nextSettings };
    saveState(state);
    return delay(clone(state.settings));
  },
  async optimizeResume(jobId) {
    return delay({
      status: "PASS",
      score: 82,
      variant_id: "mock-v1",
      filename: "ats_optimized_v1.md",
      keywords: ["React", "Product Strategy", "User Research"]
    });
  },
  async fetchStudyGuide(jobId) {
    return delay({
      skill_gaps: ["Advanced Analytics", "A/B Testing Frameworks"],
      business_context: "Enterprise SaaS focus on logistics automation.",
      research_prompts: [
        "How they integrate with SAP systems",
        "Their 'Fleet Master' product architecture",
        "Recent Series B funding objectives"
      ]
    });
  }
};
