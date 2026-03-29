# Compaction Strategy — Coachency

## When to Compact
- Context usage above 50% → manual `/compact`
- Switching to a completely different task → `/clear` instead
- Never let context reach 80%+ before compacting

## What to ALWAYS Preserve
- List of all files modified in the current session (with paths)
- Current task: what's being worked on and what's left to do
- Architecture decisions made during the session
- Any failing tests, errors, or bugs being debugged
- Active branch (staging vs main)
- Which edge functions were deployed and which migrations were applied

## What to ALWAYS Drop
- Full file contents already written to disk (read them again if needed)
- Verbose debug output and stack traces (keep only the conclusion)
- Intermediate proposals that were rejected before the final version
- Full SQL query results (keep only the conclusion)
- Long audit reports already acted on (keep only remaining items)

## Compact Command Template
Use this format when compacting:
/compact Preserve: [current task], [files modified: list], [decisions: list], [remaining work: list], [branch: staging/main], [deployed functions: list], [applied migrations: list]. Drop verbose outputs and resolved items.

## Context About This Project
After compaction, Claude can recover full project context by reading:
- CLAUDE.md (architecture, commands, conventions)
- .claude/skills/ (7 skills covering all domains)
- git log --oneline -20 (recent changes)
Don't preserve information that's already in these files.
