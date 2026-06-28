# docloop — doc↔LLM review GUI

The human side of the **doc↔LLM collaboration plane** (see issue
[#53](https://github.com/vorpalvorpal/Doktoreltern/issues/53) and the wiki page
`wiki-loop-draft`). A local, Claude-Code-launched Milkdown editor: edit a
git-tracked markdown doc, see Claude's changes as inline diffs, comment/request in
a sidebar, "Hand to Claude" to commit + trigger the LLM turn.

Standalone for now; wrapped as a Claude Code plugin once it works (after M3).

## M0 — round-trip gate (current milestone)

The make-or-break spike. Storage is **markdown with raw-HTML tags**:
`<mark data-thread="…">` comment anchors inline, an `<article data-thread="…">`
foot-region below a final `---`, and `<ins>`/`<del>` diff tags. Everything
downstream assumes **Milkdown can load and re-serialise that markdown without
mangling it**. M0 proves — or disproves — that.

Run: `npm test` (Vitest). The gate is `test/roundtrip.test.ts`:

- round-trip is **idempotent** (stable fixpoint after first normalisation),
- standard markdown is **not over-escaped** (no spurious `\*`, `\[`, …),
- `<mark data-thread>`, `<ins>`/`<del>`, and the `<article>` foot-region **survive
  byte-clean** (tags + attributes intact).

If a tag genuinely cannot round-trip, that is a **FAIL** and a signal to change the
storage scheme — **not** something to paper over by loosening the test.
