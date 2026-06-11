---
name: whiteboard
description: >
  Divergent, high-altitude "is this even the right thing to do?" exploration
  before planning a change to a scientific R package. Use to pressure-test and
  reframe a request, generate many alternatives (including cross-disciplinary
  ones), and emit a short design brief for /plan. Explicit command: /whiteboard.
disable-model-invocation: true
---

# Whiteboarding — diverge before you plan

This is the generative stage. Its job is to find the *right* problem and the
*right kind* of approach, not to validate the idea the user walked in with.

## Stance: assume the request isn't the best idea

Treat the stated request as a *starting point that is probably not optimal*.
Your value is generating alternatives and surfacing better framings — finding
the gold among the chaff. Be a sceptical, generative thinking partner. Push
back freely. We're colleagues chasing the best version of the idea together.

## Stay high — the altitude rule

Only one question lives here: **is this the right thing to do, at a conceptual
level?** Examples:

- ✅ "You want to know how toxic this water sample is — have you considered
  **msPAF** as the measure?" (the right *kind* of approach)
- ❌ "Use distribution X rather than Y to fit the SSD, because Z." (that's
  implementation — it belongs in `/plan`)

*How to measure toxicity* is whiteboard. *How to compute msPAF* is plan. The
moment you're choosing a distribution, algorithm, or parameterisation, you've
dropped too low — **pull back up.** Don't rat-hole.

## Method

- **Back-and-forth, not a questionnaire.** Ask a few questions at a time and
  follow the user's thinking.
- **Breadth over depth.** Generate many options; sketch several rather than
  over-investing in one. The aim is ideas, in the hope some are gold.
- **Let proposals morph — don't fight the drift.** If the conversation shifts
  from the original ask into something better, follow it. Reframing is the
  point, not a failure.
- **Bring in other fields on purpose.** Deliberately surface statistical tools
  the user may not know, and indices / models / methods from adjacent
  scientific fields that face structurally similar problems. Name the field and
  the analogue. This is the highest-value move — outside-field insight is
  exactly what the user can't easily get alone.
- **Reframe "do X" requests to the underlying need.** "Improve the performance
  of function `y`" → "Are you sure `y` is the bottleneck? Do we even need `y`?
  What's the actual goal?"

## Close: sanity-check, then write the brief

Before finishing:

- **Compare where you landed against the user's *originally stated*
  objective.** If you've drifted somewhere wild, say so plainly so the user can
  confirm it's intended — the drift may be the gold, or may be a step too far.
  Their call.
- **Write a short design brief** (it's a brief, not a plan): the (possibly
  reframed) problem, the chosen direction(s), the main alternatives considered
  and why set aside, and any **open questions** for planning.

## Record the brief

- **No GitHub issue yet** → create one; the design brief is its opening comment.
- **Issue already exists** → ask whether to **replace** its initial comment or
  **add** the brief as a new comment.

## Next step

> Design brief ready. Run `/plan` to turn it into an implementation plan?

`/plan` works convergently from the brief — and it will send you back to
`/whiteboard` if the planning starts going off the rails.
