# Phase 11: Multi-Page Deep Scrape - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** User Request (Console-first, Scrapling adoption)

<domain>
## Phase Boundary
This phase delivers a robust, console-driven batch discovery engine capable of pulling 500-700+ job listings from LinkedIn across multiple pages using the **Scrapling** framework. It replaces the previous Playwright/Scrapy research.

</domain>

<decisions>
## Implementation Decisions

### 🕷️ Scraping Framework
- **Tool**: Scrapling (D4Vinci) using `StealthySession`.
- **Mode**: Headless (Console-only).
- **Reasoning**: Superior TLS fingerprinting and "Adaptive" element selection to handle LinkedIn's dynamic layout.

### 🔄 Pagination Strategy
- **Logic**: Use LinkedIn's `start=N` query parameter (N=0, 25, 50...).
- **Batch Size**: 25 jobs per page.
- **Max Depth**: Configurable via CLI (default 20 pages / 500 jobs).

### 🛡️ Bot Detection Avoidance
- **Delays**: Randomized `asyncio.sleep` (2-5 seconds) between page fetches.
- **Stealth**: Utilize Scrapling's built-in `StealthyFetcher` to mimic human browser signatures.

### 💾 Data Persistence
- **Duplicate Check**: Reuse `Job.generate_id(company, title, location)` to prevent re-inserting existing jobs.
- **Model**: Integrate with `Job` SQLModel in `app.models.base`.

</decisions>

<canonical_refs>
## Canonical References

### 📦 Dependencies
- `scrapling` — Primary crawling library.
- `sqlmodel` — Database ORM.

### 🐍 Existing Code
- `backend/app/models/base.py` — Target model for job persistence.
- `backend/app/db/session.py` — Database session management.

</canonical_refs>

<specifics>
## Specific Ideas
- The script should be runnable as: `python scripts/deep_scrape_scrapling.py "Job Title"`
- Output should stream progress to the console (e.g., "Found 25 jobs...", "Total 150...").

</specifics>

<deferred>
## Deferred Ideas
- Automated application submission (Phase 12).
- Proxy rotation (only if we hit 429 errors in this phase).

</deferred>
