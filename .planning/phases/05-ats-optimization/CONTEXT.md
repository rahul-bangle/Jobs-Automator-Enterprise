# Phase 05 Context: ATS Optimization Engine

## Objective
Implement an automated ATS (Applicant Tracking System) Optimization Engine that ensures every resume is tailored to its specific Job Description (JD) before any application is submitted.

## Core Requirements
- **Match Scoring**: Algorithm to compare resume text with JD and output a 0-100 score.
- **Analysis**: Identify missing keywords, skills, and alignment gaps.
- **Iterative Optimization**: 
  - If score < 75, use LLM (Groq) to rewrite/tailor the resume.
  - Max 3 optimization attempts.
  - Stop when score >= 75 ("Ready to Apply").
- **Quality Controls**: 
  - No fake experience/skills.
  - ATS-friendly formatting (Clean Markdown/Plain Text).
  - No keyword stuffing.

## Integration Points
- **Upstream**: Intelligence Layer (Job Scoring).
- **Downstream**: Action Layer (Submission Flow).
- **Gatekeeper**: Resumes must have a "PASS" status (Score >= 75) to proceed to submission.

## Persistence
- Save `ResumeVersion` (Original, Iterations).
- Track `JobId`, `Score`, `Status`, and `Keywords`.
