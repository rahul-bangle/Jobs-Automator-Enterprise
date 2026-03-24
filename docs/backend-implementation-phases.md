# Backend Implementation Phases

## B1. Foundation
- Create FastAPI app under `backend/`.
- Add environment config loader.
- Add repository abstraction for Supabase primary / SQLite fallback.
- Add `/health` and `/config/status`.

### Tests
- app boot test
- env validation test
- Supabase connectivity test when configured
- SQLite fallback test locally

## B2. Campaign and Resume APIs
- campaign CRUD
- resume metadata storage
- active campaign fetch

### Tests
- create/update/read campaign
- resume metadata persistence
- validation errors

## B3. Import Backend
- CSV parser
- XLSX parser
- URL batch parser
- normalization and dedupe

### Tests
- mixed header file parsing
- malformed row rejection
- dedupe behavior
- import summary accuracy

## B4. Extraction and Source Classification
- adapter registry
- Greenhouse adapter
- Lever adapter
- Ashby adapter
- generic fallback classifier

### Tests
- supported sample URL extraction
- unsupported URL routing to review
- source kind classification

## B5. Trust and Relevance Scoring
- source trust heuristics
- scam/suspicion flags
- PM/APM relevance scoring
- fresher-fit scoring
- queue routing

### Tests
- irrelevant role downgrade
- suspicious listing flagging
- PM/APM prioritization

## B6. Resume Variant and Packet Generation
- resume-job matching
- tailored PM variant generation
- application packet builder
- approval state machine

### Tests
- correct variant attachment
- approval enforcement
- complete packet payload

## B7. Submission Engine
- supported ATS browser automation only
- manual approval checkpoint
- success/failure logging
- retry-safe behavior

### Tests
- unapproved packet blocked
- approved packet flow succeeds in supported path
- failure reason logging
- duplicate submission prevention

## B8. Hardening
- audit log
- better error taxonomy
- retry/backoff
- admin diagnostics

### Tests
- state transitions logged
- repeated failure handling
- diagnostic visibility
