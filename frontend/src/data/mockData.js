export const initialCampaign = {
  id: 'campaign-default',
  name: 'Global PM Search',
  targetRoles: [],
  adjacentRolesEnabled: true,
  preferredLocations: '',
  workModes: ['Remote'],
  excludedCompanies: '',
  trustThreshold: 70,
  relevanceThreshold: 75,
  workAuthorization: '',
  standardAnswers: '',
};

export const initialImportBatches = [];
export const initialJobs = [];

export const initialResumeVariants = [
  {
    id: 'resume-base',
    label: 'Base Resume',
    roleFocus: 'General',
    matchScore: 0,
    isBase: true,
    content: 'Pate your base resume markdown here.',
  },
];

export const initialApplicationPackets = [];
export const initialSubmissionAttempts = [];
