# docloop — handoff for a dogfooding conversation

This orients a fresh Claude conversation that is taking **Claude's turn** in the
docloop human↔LLM review loop. Keep it in sync as docloop changes.

## What docloop is

docloop is a small GUI (a Vite app under `docloop/` in the `~/Documents/skills`
repo) for a human↔LLM document-review loop. A human edits a Markdown document and
leaves comments on it in the browser; Claude reads what changed, edits the
document and answers the comments; the human reloads and sees Claude's changes as
a diff with the replies in the margin. It's a deliberately rough **v0** we're
dogfooding to help co-write the rest of this repo — the "MCP" that would normally
broker the hand-off is, for now, *hand-simulated by Claude working directly in the
files*. The document under review lives at `docloop/workspace/doc.md`, which is
its **own git repo** (separate from the code repo, and gitignored from it) where
**each commit is one turn**. You don't need the dev server running to take a turn —
that's the human's GUI; you just work in the files and commit.

## The pieces

Comments are stored out-of-line:

- `docloop/workspace/doc.md` — the document. It holds only **anchors**, never
  comment bodies: `:mark[highlighted span]{#t1}` inline, or `:::mark{#t1}` … `:::`
  around whole blocks.
- `docloop/workspace/threads/<id>/` — one directory per comment thread; each
  comment is `0001.md`, `0002.md`, … a tiny `author:` / `created:` frontmatter
  block followed by a free-Markdown body.
- `docloop/workspace/turn.xml` — written by the GUI when the human hands a turn
  over. **This is what you read.** It has a `<threads>` section (only the threads
  that *changed this turn* — `status="opened|updated|resolved"`, each carrying its
  full current comments) and an `<edits>` section (a word-level diff of the prose
  as `<ins>`/`<del>`, grouped by heading).

## Your turn

1. **Read** `docloop/workspace/turn.xml` — that's the human's delta and the
   threads waiting on you.
2. **Edit** `docloop/workspace/doc.md` for any requested prose changes.
   - To leave your *own* comment on the human's text, wrap a span in
     `:mark[…]{#tN}` with a fresh id (`tN` = max existing id + 1, across both the
     doc's anchors and the `threads/` dirs).
   - To **resolve** a thread, delete its `:mark` anchor from the doc *and* remove
     its `threads/<id>/` directory.
3. **Reply** in a thread by adding the next-numbered `NNNN.md` under
   `docloop/workspace/threads/<id>/`, with frontmatter `author: C` and `created:`
   a current **UTC** ISO timestamp, e.g.:
   ```
   ---
   author: C
   created: 2026-06-30T09:00:00.000Z
   ---
   Your reply, as normal Markdown.
   ```
4. **Normalise** the doc so the diff stays byte-clean (skipping this produces
   spurious diff noise): from the `docloop/` directory run
   `npm run canonicalize -- workspace/doc.md`.
5. **Commit** the turn in the workspace repo:
   `git -C workspace add doc.md threads && git -C workspace commit -m "…"`.

The human then clicks **Reload** in the GUI and sees your edits diffed against
their last turn, with your replies in the margin. Keep edits surgical and prose
canonical — the whole point of the loop is honest, low-noise diffs.

## Running the GUI (the human's side)

From `docloop/`: `npm run dev`, then open the printed URL (default
`http://localhost:5173`). Not needed to take a turn, but useful for seeing the
state. "Hand to Claude" commits the human's turn and writes `turn.xml`; "Reload"
pulls the latest committed doc.
