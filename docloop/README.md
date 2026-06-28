# docloop — doc↔LLM review GUI

The human side of the **doc↔LLM collaboration plane** (see issue
[#53](https://github.com/vorpalvorpal/Doktoreltern/issues/53) and the wiki page
`wiki-loop-draft`). A local, Claude-Code-launched Milkdown editor: edit a
git-tracked markdown doc, see Claude's changes as inline diffs, comment/request in
a sidebar, "Hand to Claude" to commit + trigger the LLM turn.

Standalone for now; wrapped as a Claude Code plugin once it works (after M3).

## Status — M3 (the loop closes)

The full vertical slice is in: **M0** round-trip gate · **M1** read view (diff
decorations + thread sidebar) · **M2** write (add/reply/resolve, hunk
accept/reject) · **M3** the doc↔LLM loop.

**The M3 loop** (a `vite` dev server, `npm run dev`):

1. The human edits the doc and clicks **Hand to Claude** → `POST /commit` writes
   `workspace/doc.md` and commits it in the workspace's own git repo
   (**commit == turn**), and renders the human's delta to `workspace/turn.xml`.
2. **Claude** (hand-simulating the MCP for this v0 — see the wiki dogfooding note)
   reads `turn.xml`, edits `doc.md`, and commits.
3. The human clicks **Reload** → `GET /doc` returns `current` (HEAD) and
   `baseline` (the commit before it); the read view diffs them, so Claude's edits
   appear as `<ins>`/`<del>` decorations and any new replies show in the sidebar.

`turn.xml` is the LLM-facing render (`src/turn.ts`): **XML**, edits grouped by
their enclosing heading, **open items (threads) first**. It's a pure, tested
string transform — the deterministic core of the future MCP. See `test/turn.test.ts`.

## M0 — round-trip gate (the foundation)

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
