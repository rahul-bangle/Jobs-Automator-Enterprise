# Frontend Contracts

## Service Interface

The frontend is implemented against a stable mock service layer with these methods:

- `saveCampaign(payload)`
- `previewImportFile({ fileName, urls })`
- `confirmImportBatch(preview)`
- `approveReviewItem(jobId)`
- `rejectReviewItem(jobId)`
- `snoozeReviewItem(jobId)`
- `markDuplicate(jobId)`
- `approveApplicationPacket(packetId)`
- `setPacketResumeVariant(packetId, resumeVariantId)`
- `saveSettings(payload)`

## Mock Entities

### Campaign
- `id`
- `name`
- `targetRoles`
- `adjacentRolesEnabled`
- `preferredLocations`
- `workModes`
- `excludedCompanies`
- `trustThreshold`
- `relevanceThreshold`
- `workAuthorization`
- `standardAnswers`

### ImportBatch
- `id`
- `createdAt`
- `sourceType`
- `fileName`
- `totalRows`
- `acceptedRows`
- `reviewRows`
- `rejectedRows`

### JobCandidate
- `id`
- `companyName`
- `jobTitle`
- `source`
- `sourceUrl`
- `location`
- `trustScore`
- `relevanceScore`
- `queueStatus`
- `atsType`
- `fitSummary`
- `riskFlags`
- `createdAt`

### ApplicationPacket
- `id`
- `jobId`
- `resumeVariantId`
- `approvalStatus`
- `warnings`
- `fitReasons`

### ResumeVariant
- `id`
- `label`
- `roleFocus`
- `matchScore`
- `isBase`
- `content`

### SubmissionAttempt
- `id`
- `packetId`
- `companyName`
- `jobTitle`
- `source`
- `timestamp`
- `outcome`
- `failureReason`

## Routes

- `/dashboard`
- `/campaign`
- `/import`
- `/jobs`
- `/review`
- `/applications`
- `/resumes`
- `/submissions`
- `/settings`

## Backend Notes

- Contracts are intentionally database-agnostic.
- Supabase is the preferred persistence target.
- SQLite remains the local fallback.
- Submission endpoints must enforce explicit approval state before any later automation step.
