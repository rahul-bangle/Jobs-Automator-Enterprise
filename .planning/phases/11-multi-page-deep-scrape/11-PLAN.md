# Phase 11: Multi-Page Deep Scrape - Plan

**Status:** Ready for Execution
**Goal:** Discover 500-700+ jobs from LinkedIn using a headless, adaptive Scrapling scraper.

## 🌊 Wave 1: Core Scraper Implementation

### Task 11.1: Finalize `deep_scrape_scrapling.py`
Build the production-ready scraper script at `backend/scripts/deep_scrape_scrapling.py`.

- **Action**: Implement `StealthySession` with `asyncio` for concurrent pagination.
- **Read First**: `backend/app/models/base.py`, `backend/app/db/session.py`.
- **Acceptance Criteria**: 
  - Script imports `scrapling.fetchers`.
  - CLI accepts a search query string.
  - Successfully pulls at least 25 jobs from LinkedIn Page 1.

## 🌊 Wave 2: Batch Execution & Verification

### Task 11.2: Global Discovery Run
Execute the 700-job Batch Scrape from the console.

- **Action**: Run `python scripts/deep_scrape_scrapling.py "Associate Product Manager"`.
- **Read First**: `backend/scripts/deep_scrape_scrapling.py`.
- **Acceptance Criteria**: 
  - Database contains 100+ new entries in the `Job` table.
  - Log output confirms multiple pages were successfully fetched.

### Task 11.3: Data Integrity Audit
Verify that the scraped jobs contain valid URLs and haven't triggered a broad ban.

- **Action**: Run a simple SQL query to check `Job` table count and sample URLs.
- **Read First**: `backend/app/models/base.py`.
- **Acceptance Criteria**: 
  - `Job` table has a count > 100.
  - Sample `source_url` starts with `https://www.linkedin.com/`.

## 🧪 Verification Plan

### Automated Verification
- Run the script and check console output for page progression.
- Use `Invoke-SqliteQuery` (or equivalent) to count records in `job_automator.db`.

### Manual Review
- Sample 5 jobs from the database and open their URLs to ensure correct parsing.
