# Debug Session: V2 Pipeline Regressions

## Symptoms
- [x] CORS Block on `/api/v1/v2/jobs/discovery`
- [x] 500 Internal Server Error on Discovery
- [x] 404 Not Found on `/api/v1/v2/growth/{id}`

## Hypotheses
1.  **H1: Missing GROQ_API_KEY**: The new Groq-powered parsing/scoring is failing due to missing env vars, causing 500 errors.
2.  **H2: Routing Conflict**: The `v2` router might be clashing with existing `/jobs` prefix in another router.
3.  **H3: JobSpy Synchronous Block**: Despite the threadpool, `JobSpy` might be hanging or throwing an exception that's not caught well.
4.  **H4: Database State**: 404 on `growth` might be because the `job_id` passed from frontend doesn't match the database record (ID generation logic mismatch).

## Investigation Log
- [ ] Check `.env` for `GROQ_API_KEY`.
- [ ] Check `Job.generate_id` logic vs frontend `job_id` origin.
- [ ] Run backend with verbose logging.
- [ ] Test endpoints via `docs` (Swagger) to bypass CORS for 500 diagnostics.

## Evidence
- Browser Console: `net::ERR_FAILED 500` and `404 Not Found`.
