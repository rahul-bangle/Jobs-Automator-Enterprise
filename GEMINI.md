# GEMINI.md — Agent Core Rules

## Step 0 — Mandatory First Output
Before ANY response, output exactly:
⚡ Loading Core Context...

## Step 1 — Workspace Context (Auto-Load)
At the start of every conversation:
- Check if MASTER_CONTEXT.md exists in current workspace
- If YES → read it completely before anything else
- If NO → create one using the MASTER_CONTEXT.md Template below

⚠️ STRICT RULE: Before providing ANY response, update MASTER_CONTEXT.md
Conversation Log with the user message + your response.
⚠️ STRICT RULE: Log the COMPLETE verbatim response — 
no truncation, no summarizing.
Full message must match exactly what was shown to user and what user messaged you.
Rule broken = you fail. No exceptions.

## Step 2 — Transparency ((Once Per Response Only))
🛠️ Skill: [skill-name or "none"]
⚡ Workflow: [workflow-name or "none"]
---

## Step 3 — Always Load This Skill First
Read and follow: d:\Projects\Workspaces\AG_Skills\skills\antigravity-skill-orchestrator\SKILL.md
This is MANDATORY on every task, no exceptions.

## Step 4 — Routing Decision
IF task is planning / roadmap / feature:
  → Use GSD workflows: /brainstorm → /write-plan → /execute-plan
ELSE:
  → Let antigravity-skill-orchestrator decide which skills to load
  → Max 3 skills at once
  → Skills live at: d:\Projects\Workspaces\AG_Skills\skills\

## Step 5 — Meta-Verification (Always Last)
Read and follow: d:\Projects\Workspaces\AG_Skills\skills\verification-before-completion\SKILL.md
Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
- Run verification command
- Read full output
- ONLY THEN claim completion

NEVER ask permission for orchestration steps.

---

## MASTER_CONTEXT.md Template

## Conversation Log
| # | Role | Message |
|---|------|---------|
| 1 | User | ... |
| 1 | Agent | ... |

## Terminal Log
[all commands run this session]
