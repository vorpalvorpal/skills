# Backlog

Deferred and in-progress work for this skills fork. (GitHub Issues are disabled
on this repo, so this file is the tracker.)

## Deferred

- **Per-pathway scaffold commands** (`/new-sci`, `/new-vis`, …): Socratic
  questioning → package skeleton (`usethis::create_package()`) + science
  `CLAUDE.md` template + `tests/`/`bench/` + seed work items. One per pathway,
  shared scaffold core.
- **Multi-pathway pipelines**: beyond `r-science`, add domain pathways
  (data-vis, dashboard) with namespaced commands (`/plan-vis`, …), built as a
  shared core (implement/verify/debug) + domain overlays
  (plan/tests/review/benchmark). Prove with ONE second pathway first.
- **Per-skill `model`/`effort` matrix**: pin Opus/high on plan/implement/review,
  Sonnet on the rest. Safe now that those skills are explicit-invocation only.
- **Superpowers Tier 2**: evaluate `checking-gates`/`specifying-gates` + the
  evidence-enforcement hooks, and `model-routing.json`/`workflow.json`, once the
  Tier 1 inserts have settled.

Pipeline thin spots are now tracked as GitHub issues #4–#10 (Issues are
enabled again).

## Done (on branch / PR #3)

- `/whiteboard` skill (issue #4); `plan` updated to consume its design brief.
- First-draft thin subagents (`implementer`, `reviewer`, `benchmarker`,
  `plan-reviewer`) + `subagent-workflow.md`.
- Persuasion tightening of the load-bearing correctness rules.
- Data conventions (Frictionless CSV; `qs2`/DuckDB for large data).
- Basic bash upstream-watch for superpowers (monthly; opens an issue on change).

## Still to do (Tier-1 inserts, tracked as issues)

- `systematic-debugging` insert (#5), worktree isolation (#6), stage
  granularity (#7), reproducible env (#8), reference-data provenance (#9),
  Frictionless skill (#10).
