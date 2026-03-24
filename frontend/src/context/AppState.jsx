import { useEffect, useMemo, useState } from 'react';
import { mockApi } from '../services/mockApi.js';
import { AppStateContext } from './appStateContext.js';

export function AppStateProvider({ children }) {
  const [state, setState] = useState({
    campaign: null,
    jobs: [],
    importBatches: [],
    resumeVariants: [],
    applicationPackets: [],
    submissionAttempts: [],
    settings: null,
  });
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    mockApi.getInitialState().then(setState).finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => ({
      async saveCampaign(payload) {
        const campaign = await mockApi.saveCampaign(payload);
        setState((previous) => ({ ...previous, campaign }));
      },
      async previewImport(payload) {
        const nextPreview = await mockApi.previewImportFile(payload);
        setPreview(nextPreview);
      },
      clearPreview() {
        setPreview(null);
      },
      async confirmImportBatch() {
        if (!preview) return;
        const nextState = await mockApi.confirmImportBatch(preview);
        setState(nextState);
        setPreview(null);
      },
      async approveReviewItem(jobId) {
        setState(await mockApi.approveReviewItem(jobId));
      },
      async rejectReviewItem(jobId) {
        setState(await mockApi.rejectReviewItem(jobId));
      },
      async snoozeReviewItem(jobId) {
        setState(await mockApi.snoozeReviewItem(jobId));
      },
      async markDuplicate(jobId) {
        setState(await mockApi.markDuplicate(jobId));
      },
      async approveApplicationPacket(packetId) {
        setState(await mockApi.approveApplicationPacket(packetId));
      },
      async setPacketResumeVariant(packetId, resumeVariantId) {
        await mockApi.setPacketResumeVariant(packetId, resumeVariantId);
        setState(await mockApi.getInitialState());
      },
      async saveSettings(settings) {
        const saved = await mockApi.saveSettings(settings);
        setState((previous) => ({ ...previous, settings: saved }));
      },
    }),
    [preview],
  );

  const derived = useMemo(() => ({
    dashboardStats: {
      totalImported: state.jobs.length,
      trustedAccepted: state.jobs.filter((job) => job.queueStatus === 'accepted').length,
      inReview: state.jobs.filter((job) => job.queueStatus === 'review' || job.queueStatus === 'snoozed').length,
      rejected: state.jobs.filter((job) => job.queueStatus === 'rejected').length,
      readyToApply: state.applicationPackets.filter((packet) => packet.approvalStatus === 'ready').length,
      approved: state.submissionAttempts.filter((item) => item.outcome === 'approved').length,
      failed: state.submissionAttempts.filter((item) => item.outcome === 'failed').length,
      duplicateBlocked: state.jobs.filter((job) => job.queueStatus === 'duplicate').length,
    },
    reviewQueue: state.jobs.filter((job) => job.queueStatus === 'review' || job.queueStatus === 'snoozed'),
    applicationQueue: state.applicationPackets,
    recentBatches: state.importBatches,
  }), [state]);

  return <AppStateContext.Provider value={{ state, loading, preview, actions, derived }}>{children}</AppStateContext.Provider>;
}
