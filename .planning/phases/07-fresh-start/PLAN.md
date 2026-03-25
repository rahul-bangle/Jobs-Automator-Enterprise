# Phase 07 — Fresh Start: Architecture Hardening

## Context
Fixed 404 routing issues and missing startup `init_db`. Encountered 500 OperationalError (missing `description` column), indicating legacy DB schema mismatch.

## Tasks
[ ] Reset Database
    - [ ] Delete `backend/job_automator.db`
    - [ ] Restart server to trigger `init_db`
[ ] Harden Execution Environment
    - [ ] `venv_new/Scripts/python -m playwright install chromium`
    - [ ] Verify `python-jobspy` imports
[ ] Backend Architecture Polish
    - [ ] Add structured logging to `pipeline_v2.py`
    - [ ] Add timeout resilience to `AsyncWebCrawler`
[ ] Final Verification
    - [ ] `Invoke-RestMethod` verification (POST /discovery)
    - [ ] Frontend integration check
