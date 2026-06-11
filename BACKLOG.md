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

## In progress

- **Tier 1 superpowers inserts** into the sci pathway: `systematic-debugging`,
  `verification-before-completion`, `using-git-worktrees` (by reference, not
  copied) + a new `/whiteboard` skill adapted from their `brainstorming`.
- **Thin subagents** for `review` and `benchmark` (adapted from superpowers
  `subagent-driven-development`).
- **Upstream-watch for superpowers**: monthly check for new/changed upstream
  files relevant to our pipeline, reported to the user.
