# Phase 05 Plan: ATS Optimization Engine

## 🏗️ Wave 1: Persistence & Models
- [ ] Add `ATS_Match` fields to `ResumeVariant` model in `models/base.py`.
- [ ] Run `init_db.py` to migrate schema.
- [ ] Create `ATSOptimizationLog` model for tracking iteration outcomes.

## 🧠 Wave 2: Core ATS Service
- [ ] Implement `ATSService` in `app/services/ats.py`.
  - [ ] Implement `calculate_ats_score` (LLM-based or keyword-based).
  - [ ] Implement `identify_alignment_gaps` (Keywords, Skills, Experience).
  - [ ] Implement `optimize_resume_iteration` (Groq tailing prompt).
  - [ ] **NEW**: Implement `generate_study_guide` (Gap analysis & research prompts).

## 🚀 Wave 3: Iterative Loop & Integration
- [ ] Implement `run_optimization_pipeline` with 3-iteration logic.
- [ ] Integrate into `UnifiedPipeline` (between Intelligence and Action layers).
- [ ] Ensure blocking logic for non-PASS resumes (Score < 75).

## 🎨 Wave 4: Frontend UI
- [ ] Update **Review Queue** to display "ATS Score" and "Keywords".
- [ ] Add "Optimize" button status (Optimizing -> Ready).
- [ ] **NEW**: Add "Study Guide" tab to the Job Detail Drawer with research prompts.
- [ ] Display "Improvement History" (v0, v1, v2, v3).

## 🏁 Verification
- [ ] Test with a mismatched resume/JD pair (Iteration 1 -> 2 -> 3).
- [ ] Verify score threshold logic (Stop at >= 75).
- [ ] Audit optimized resumes for keyword stuffing or hallucinations.
