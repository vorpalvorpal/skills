# Subagent-driven workflow

Adapted from superpowers' `subagent-driven-development` to our pipeline. Read
this when running the per-stage loop with the r-science agents instead of
ad-hoc `general-purpose` dispatch.

**Core idea:** a fresh subagent per stage + isolated review = quality without
polluting the orchestrator's context. The orchestrator coordinates; it does not
write feature code.

## The agents (in `r-science/agents/`)

| Agent | Role | Edits? | Model |
|-------|------|--------|-------|
| `implementer` | Codes one stage to green; house style + status protocol baked in | yes | sonnet |
| `reviewer` | Final review: plan conformance + scientific soundness, then delegates code/test quality | no | opus |
| `benchmarker` | Profiling/benchmark dig; returns the conclusion | no | sonnet |
| `plan-reviewer` | Reviews a draft plan for testability before tests are written | no | opus |

Because the `implementer` bakes in the conventions and the status protocol, the
orchestrator's per-stage prompt shrinks to: objective + scientific basis +
files + the stage's pending specs. (The full prompt template in
`delegation.md` still applies when dispatching a `general-purpose` subagent
instead.)

## Per-stage loop with the implementer

1. Baseline benchmark (3a) — optionally dispatch `benchmarker` for a real dig.
2. Dispatch `implementer` for the stage. Read its **status line**:
   - `DONE` → go to review.
   - `DONE_WITH_CONCERNS` → address correctness concerns *before* review.
   - `NEEDS_CONTEXT` → supply exactly what's missing, re-dispatch.
   - `BLOCKED` → supply context, upgrade the model, split the stage smaller, or
     escalate to the user.
3. **Independently verify** — do not trust the report. Read the diff yourself
   and run the stage's specs (the `verify` skill's evidence rule applies).

## Two-stage review — correctness before quality

Review checks correctness first so you don't polish code that may need
redesign. For a full review (end of implementation), dispatch `reviewer`: it
does Stage 1 (conformance + science) itself and delegates Stage 2 (code/test
quality) to `critical-code-reviewer` / `review-testing`. When the reviewer
returns findings, the **same `implementer`** fixes them and resubmits for
re-review. Repeat until Approve — skipping the re-review defeats the gate.

## Open question for revision

The `review` skill is `disable-model-invocation: true`, which blocks it from
preloading into a subagent — so the `reviewer` agent **embeds** its checklist
rather than loading the `review` skill. Decide whether to keep both (`/review`
for manual use, `reviewer` agent for orchestrated use) or converge on one.
Similarly, confirm how this plugin exposes `agents/` once installed via the
marketplace (skills are listed in `marketplace.json`; agent discovery needs
verifying).
