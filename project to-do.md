# 🚀 Project Roadmap: Core Flow & Stability

> [!IMPORTANT]
> **Primary Flow**: Resume Upload → Job Discovery → Review → Apply

## Phase 0: Core Experience Refinement (URGENT)
- [ ] **P1: Resume Import/Upload UI**
    - Feature: Add an "Import Resume" button in the Profile/Discovery sidebar.
    - Logic: Allow local PDF/JSON upload instead of manual text entry.
- [ ] **P2: User Profiling (Resume Analysis)**
    - Feature: Analyze the uploaded resume to extract Skills, Experience, and Role.
    - Logic: Use AI to answer "Who is this user?" so the Tailor Engine has a baseline profile.
- [ ] **P3: Discovery Persistence (Save/Favorites)**
    - Feature: "Save Job" button on every card.
    - Logic: Store jobs in `job_automator.db` so they don't disappear on every search.
- [ ] **P4: Job Detail Screen**
    - Feature: Clicking a job card opens a full-screen view with the complete description.
    - UI: Move away from "Just a Card" to a full application-like detail view.
- [ ] **P5: Job Title Suggestions (Auto-complete)**
    - Feature: Mirror the location suggestion behavior for the Job Title input.
    - Logic: Use a predefined list of roles or a lightweight API call to suggest titles as the user types.
- [ ] **BUG FIX: Salary Data Extraction**
    - Issue: "$ TBD" showing on most cards.
    - Action: Improve regex/parsing in `pipeline_v2.py` to catch compensation ranges.
- [ ] **CLEANUP: UI De-cluttering (Remove Theme Toggle)**
    - Component: `ThemeToggle.jsx`.
    - Note: Remove the redundant dark-mode toggle to simplify the header.
- [ ] **UI: Global Selection Color**
    - Feature: Change the text selection/highlight color across the entire application.
    - Style: Use a custom `::selection` color matching the Pro-Blue branding.

## Phase 3: Architectural Evolution (Future)
*   **Background Discovery Engine**: Scanning company career pages every 6 hours automatically.
*   **Central Cluster Processor**: AutoExtract ML (No CSS) + Taxonomy + Deduplication.
*   **Automated Delivery**: Daily "Data Dump" (CSV/JSON/S3) + Email/Push results.
*   **Direct-to-Source**: Scraping ATS like Workday/Greenhouse/Lever.

---
*Status: Roadmap Updated based on user feedback (2026-03-26)*
