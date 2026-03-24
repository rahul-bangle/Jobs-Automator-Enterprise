# Backend Step By Step Guide

This file explains the backend in very simple language.

Think of the backend as the "engine room" behind your frontend.

The frontend is what you see.
The backend is what does the real work:
- save data
- read data
- check job links
- score jobs
- prepare applications
- later submit supported applications

## Phase 1: Make the backend folder alive

### Goal
Start a simple FastAPI app that can run.

### What to do
1. Go to the `backend/` folder.
2. Create a Python virtual environment.
3. Install FastAPI and Uvicorn.
4. Create one file called `main.py`.
5. Add one simple route: `/health`.
6. Run the server.

### Why this matters
Before building a house, we make the foundation.
This step checks that the backend can start.

### Test
- Open `http://localhost:8000/health`
- It should return something like:
  - `{ "status": "ok" }`

## Phase 2: Add config and secrets

### Goal
Teach the backend how to read environment variables.

### What to do
1. Create a `.env` file.
2. Add placeholders for:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `DATABASE_MODE`
3. Create a config file that reads them safely.
4. If values are missing, show clear errors.

### Why this matters
Secrets should not be written directly into code.

### Test
- Start backend with `.env`
- Confirm config loads correctly
- Confirm missing values show understandable errors

## Phase 3: Choose database mode

### Goal
Support:
- Supabase as main choice
- SQLite as fallback

### Simple idea
Make one backend layer that says:
- "save campaign"
- "get jobs"
- "save submission"

Then inside that layer:
- use Supabase if configured
- else use SQLite

### Why this matters
Frontend should not care which database is used.

### Test
- Run once with Supabase config
- Run once with SQLite config
- Both should work with same API shape

## Phase 4: Save the campaign

### Goal
Store the campaign settings from the frontend.

### What is campaign data
- campaign name
- target roles
- preferred locations
- excluded companies
- trust threshold
- relevance threshold
- work authorization
- standard answers

### What to build
- `POST /campaign`
- `GET /campaign/{id}`
- `PATCH /campaign/{id}`

### Test
- Save a campaign
- Read it back
- Update one field
- Check that the change is saved

## Phase 5: Save imported job batches

### Goal
Store bulk uploaded jobs.

### What to build
- endpoint for CSV/XLSX uploads
- endpoint for pasted URLs
- parser logic
- duplicate checker

### Simple logic
When jobs come in:
1. read the rows
2. clean the fields
3. reject broken rows
4. mark duplicates
5. save good rows

### Test
- upload file with good rows
- upload file with some bad rows
- upload duplicate rows
- check accepted/review/rejected counts

## Phase 6: Understand job links

### Goal
Read supported job pages like:
- Greenhouse
- Lever
- Ashby

### What to build
Create small adapters.

One adapter means:
- check if URL belongs to that site
- fetch page
- extract company, title, location, description

### Why adapters
Each site has a different page structure.
So we make one extractor per site.

### Test
- give one sample Greenhouse URL
- extract correct job data
- do same for Lever and Ashby

## Phase 7: Score trust and relevance

### Goal
Decide whether a job is:
- accepted
- review
- rejected

### Trust score means
How safe or reliable the job source looks.

### Relevance score means
How well the job matches your target:
- PM
- APM
- fresher

### Simple backend rules
If source is trusted and role is relevant:
- accepted

If source is unclear or role is borderline:
- review

If role is wrong or source looks suspicious:
- rejected

### Test
- trusted PM role should become accepted
- unknown site should become review or rejected
- irrelevant job should become rejected

## Phase 8: Build resume variants

### Goal
Connect jobs with the best resume version.

### What to build
- save resume records
- save resume variants
- choose best variant for each job

### Simple idea
If job says:
- PM
- analytics
- user research

then select the variant that matches best.

### Test
- save base resume
- save PM variant
- save analytics variant
- confirm backend chooses correct variant for a sample job

## Phase 9: Build application packets

### Goal
Prepare everything needed before final approval.

### Application packet includes
- selected job
- selected resume
- warnings
- fit reasons
- approval status

### Why this matters
Backend should prepare the application first.
It should not submit first.

### Test
- create packet for accepted job
- packet should contain all required pieces
- packet should stay blocked until user approval

## Phase 10: Add final approval rule

### Goal
Never allow submit before approval.

### Rule
If `approval_status != approved`
then submission must fail.

### Why this matters
This protects you from blind automation mistakes.

### Test
- try submitting unapproved packet
- backend must reject it
- approve packet
- backend should now allow next step

## Phase 11: Add submission engine

### Goal
Support application submission only for stable websites.

### First websites
- Greenhouse
- Lever
- Ashby

### What to build
- Playwright browser automation
- site-specific submission steps
- success/failure result logging

### Important rule
If site is unsupported:
- do not fake success
- do not submit blindly
- create a manual follow-up task instead

### Test
- approved packet on supported site should run
- unsupported site should move to manual flow
- failures should save error reason

## Phase 12: Add logs and safety

### Goal
Track what happened every time.

### Save logs for
- imports
- review actions
- approval actions
- submission attempts
- failures

### Why this matters
Without logs, debugging is hard.

### Test
- every important action should create a clear log record

## Phase 13: Connect frontend to backend

### Goal
Replace mock data with real API calls.

### What to do
1. Keep frontend screens same.
2. Replace mock service methods one by one.
3. Connect:
   - campaign save
   - import preview
   - jobs list
   - review queue
   - application queue
   - submission log

### Test
- every page should still work
- but now data should come from backend

## Best Order To Build

Build in this order:
1. backend startup
2. config
3. database layer
4. campaign APIs
5. import APIs
6. adapter extraction
7. trust/relevance scoring
8. resume variants
9. application packets
10. approval rule
11. submission engine
12. logs
13. frontend integration

## One Simple Sentence Summary

First make the backend save and understand jobs.
Then make it score and prepare them.
Then make it ask for approval.
Only after that make it submit.
