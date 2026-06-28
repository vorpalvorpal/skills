export interface Thread {
  /** the `data-thread` id shared by the `<mark>` anchor and its `<article>` body */
  id: string;
  /** the text inside the `<mark>` (the highlighted span in the body) */
  anchor: string;
  /** the `<article>` foot-region body, or null for an orphan mark */
  body: string | null;
}

// `<mark data-thread="ID">ANCHOR</mark>` — the inline comment anchor.
// We capture the id and the inner text. Non-greedy inner match so adjacent
// marks on one line stay separate.
const MARK_RE = /<mark\s+data-thread="([^"]+)">([\s\S]*?)<\/mark>/g;

// `<article data-thread="ID">BODY</article>` — the foot-region thread body.
const ARTICLE_RE = /<article\s+data-thread="([^"]+)">([\s\S]*?)<\/article>/g;

/**
 * Extract comment threads from a docloop markdown document:
 * `<mark data-thread="id">anchor</mark>` inline anchors joined, by id, with their
 * `<article data-thread="id">body</article>` foot-region bodies. Returns one
 * entry per `<mark>`, in document order; an anchor with no matching `<article>`
 * yields `body: null`.
 *
 * Kept as plain regex over the markdown string (not a DOM parse) so the same
 * code runs in node tests and the browser, and so it stays cheap/greppable —
 * the storage scheme is deliberately plain-text (see CLAUDE.md portability aim).
 */
export function extractThreads(markdown: string): Thread[] {
  // Index article bodies by thread id for O(1) join. Last write wins if a id
  // somehow repeats (not expected; threads ids are unique).
  const bodies = new Map<string, string>();
  for (const m of markdown.matchAll(ARTICLE_RE)) {
    bodies.set(m[1], m[2]);
  }

  // Walk the marks in document order (matchAll yields left-to-right) so the
  // returned list is ordered by where the anchors appear in the body.
  const threads: Thread[] = [];
  for (const m of markdown.matchAll(MARK_RE)) {
    const id = m[1];
    threads.push({
      id,
      anchor: m[2],
      body: bodies.has(id) ? bodies.get(id)! : null,
    });
  }
  return threads;
}
