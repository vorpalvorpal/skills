/**
 * docloop write view (M2) entry point.
 *
 * M1 was read-only; M2 makes the same view writeable while keeping the editor's
 * doc as the single source of truth (see src/write-actions.ts). It wires:
 *
 *   - the diff vs a mutable BASELINE (starts as OLD_MD) painted as ProseMirror
 *     decorations (green inserts, red delete widgets) + the <mark> anchor
 *     highlights — re-derived after every action,
 *   - a threads sidebar with a reply box per thread and a Resolve control,
 *   - an "Add comment" button that anchors a comment on the current selection,
 *   - a "Changes" panel listing each diff hunk with Accept / Reject controls.
 *
 * Every mutation goes through the M0 serialise→transform→reload path, so the doc
 * the editor holds and the markdown that would be saved never disagree.
 */
import { DecorationSet } from '@milkdown/prose/view';
import { createEditor, type DocloopEditor } from './editor';
import { buildReadViewDecorations } from './decorations';
import { decorationPlugin, decoPluginKey } from './deco-plugin';
import { extractThreads, splitTurns, type Thread } from './threads';
import {
  addComment,
  reply as replyAction,
  resolve as resolveAction,
  currentMarkdown,
  loadMarkdown,
  hasTextSelection,
} from './write-actions';
import { listHunks, acceptHunk, rejectHunk, type Hunk } from './hunks';
import { OLD_MD, NEW_MD } from './sample';

/** Mutable app state: the editor + the diff baseline (advances as hunks accept). */
interface App {
  ed: DocloopEditor;
  baselineMd: string;
  els: {
    threads: HTMLElement;
    changes: HTMLElement;
    addBtn: HTMLButtonElement;
  };
  /** thread id whose reply box should grab focus after the next render */
  focusReplyFor: string | null;
}

/**
 * Load the document + diff baseline. Prefers the live git workspace via `GET
 * /doc` (current = HEAD, baseline = the commit before it) so the GUI reflects the
 * real loop; falls back to the bundled sample when no workspace exists yet (e.g.
 * a fresh checkout or the static build), so the demo still shows a diff.
 */
async function loadState(): Promise<{ current: string; baseline: string }> {
  try {
    const res = await fetch('/doc');
    const json = (await res.json()) as {
      ok: boolean;
      present?: boolean;
      current?: string;
      baseline?: string | null;
    };
    if (json.ok && json.present && typeof json.current === 'string') {
      // No prior commit -> baseline == current, so nothing diffs (correct).
      return { current: json.current, baseline: json.baseline ?? json.current };
    }
  } catch {
    // No dev server / endpoint — fall through to the sample.
  }
  return { current: NEW_MD, baseline: OLD_MD };
}

async function main(): Promise<void> {
  const editorRoot = document.getElementById('editor');
  const threadList = document.getElementById('threads');
  const changes = document.getElementById('changes');
  const addBtn = document.getElementById('add-comment') as HTMLButtonElement | null;
  if (!editorRoot || !threadList || !changes || !addBtn) {
    throw new Error('missing #editor / #threads / #changes / #add-comment');
  }

  const { current, baseline } = await loadState();

  // Editable editor with the current doc. The decoration plugin starts empty;
  // filled after the doc (and its positions) exists.
  const ed = await createEditor(editorRoot, current, {
    editable: true,
    plugins: [decorationPlugin(DecorationSet.empty)],
  });

  const app: App = {
    ed,
    baselineMd: baseline,
    els: { threads: threadList, changes, addBtn },
    focusReplyFor: null,
  };

  // "Add comment" is enabled only when there's a span to anchor on. Keep it in
  // sync with the selection.
  const syncAddBtn = () => {
    addBtn.disabled = !hasTextSelection(ed);
  };
  ed.view.dom.addEventListener('mouseup', syncAddBtn);
  ed.view.dom.addEventListener('keyup', syncAddBtn);
  syncAddBtn();

  addBtn.addEventListener('click', () => {
    const id = addComment(app.ed);
    if (id) {
      app.focusReplyFor = id; // focus its reply box once the sidebar re-renders
      rerender(app);
    }
  });

  const commitBtn = document.getElementById('commit') as HTMLButtonElement | null;
  if (commitBtn) wireCommit(ed, commitBtn);

  // "Reload" pulls the latest committed doc (e.g. after Claude's turn) and
  // re-derives the view against the previous commit.
  const reloadBtn = document.getElementById('reload') as HTMLButtonElement | null;
  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.disabled = true;
      try {
        const next = await loadState();
        loadMarkdown(app.ed, next.current);
        app.baselineMd = next.baseline;
        rerender(app);
      } finally {
        reloadBtn.disabled = false;
      }
    });
  }

  rerender(app);
}

/**
 * Commit the current document state to the workspace git repo (commit == turn).
 * Serialises the live doc via the M0 path and POSTs it to the dev-server
 * `/commit` endpoint (see vite.config.ts), which writes it and git-commits.
 */
function wireCommit(ed: DocloopEditor, btn: HTMLButtonElement): void {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Committing…';
    try {
      const res = await fetch('/commit', { method: 'POST', body: currentMarkdown(ed) });
      const json = (await res.json()) as { ok: boolean; committed?: boolean; commit?: string };
      btn.textContent = !json.ok
        ? 'Commit failed'
        : json.committed
          ? `Committed ${json.commit}`
          : 'No changes';
    } catch {
      btn.textContent = 'Commit failed';
    } finally {
      window.setTimeout(() => {
        btn.textContent = label;
        btn.disabled = false;
      }, 2500);
    }
  });
}

/** Re-derive decorations + sidebar + changes panel from the current state. */
function rerender(app: App): void {
  const { ed } = app;

  // 1. Decorations: diff live doc vs the (mutable) baseline + mark highlights.
  const baselineDoc = ed.parse(app.baselineMd);
  const liveDoc = ed.view.state.doc;
  const set = buildReadViewDecorations(baselineDoc, liveDoc);
  ed.view.dispatch(ed.view.state.tr.setMeta(decoPluginKey, set));

  // 2. Sidebar threads + 3. changes, both derived from the current markdown.
  const md = currentMarkdown(ed);
  renderThreads(app, extractThreads(md));
  renderChanges(app, listHunks(app.baselineMd, md));
}

/** Render the threads sidebar: each thread gets a reply box + Resolve button. */
function renderThreads(app: App, threads: Thread[]): void {
  const host = app.els.threads;
  host.replaceChildren();

  if (threads.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'No comment threads.';
    host.appendChild(empty);
    return;
  }

  threads.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'thread';
    li.dataset.thread = t.id;

    const head = document.createElement('div');
    head.className = 'thread-head';

    const badge = document.createElement('span');
    badge.className = 'thread-badge';
    badge.textContent = String(i + 1);
    head.appendChild(badge);

    const anchor = document.createElement('span');
    anchor.className = 'thread-anchor';
    anchor.textContent = t.anchor ? `“${t.anchor}”` : '(no anchor)';
    head.appendChild(anchor);

    const resolveBtn = document.createElement('button');
    resolveBtn.className = 'btn btn-resolve';
    resolveBtn.textContent = 'Resolve';
    resolveBtn.title = 'Unwrap the anchor and delete this thread';
    resolveBtn.addEventListener('click', () => {
      resolveAction(app.ed, t.id);
      rerender(app);
    });
    head.appendChild(resolveBtn);
    li.appendChild(head);

    const body = document.createElement('div');
    if (t.body === null || t.body === '') {
      body.className = 'thread-body muted';
      body.textContent = t.body === '' ? '(no replies yet)' : '(orphan anchor — no thread body)';
    } else {
      body.className = 'thread-body';
      // Replies are <br>-joined in storage; show each turn on its own line.
      splitTurns(t.body).forEach((turn, j) => {
        if (j > 0) body.appendChild(document.createElement('br'));
        body.appendChild(document.createTextNode(turn));
      });
    }
    li.appendChild(body);

    // Reply box.
    const form = document.createElement('form');
    form.className = 'reply-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Reply…';
    input.className = 'reply-input';
    form.appendChild(input);
    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'btn';
    send.textContent = 'Reply';
    form.appendChild(send);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      replyAction(app.ed, t.id, text);
      rerender(app);
    });
    li.appendChild(form);

    host.appendChild(li);

    if (app.focusReplyFor === t.id) input.focus();
  });

  app.focusReplyFor = null;
}

/** Render the per-hunk Accept / Reject controls. */
function renderChanges(app: App, hunks: Hunk[]): void {
  const host = app.els.changes;
  host.replaceChildren();

  if (hunks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'No pending changes.';
    host.appendChild(empty);
    return;
  }

  hunks.forEach((h) => {
    const li = document.createElement('li');
    li.className = `change change-${h.type}`;

    const label = document.createElement('span');
    label.className = 'change-label';
    const verb = h.type === 'insert' ? '+ ' : '− ';
    label.textContent = verb + h.value.trim();
    li.appendChild(label);

    const accept = document.createElement('button');
    accept.className = 'btn btn-accept';
    accept.textContent = 'Accept';
    accept.title = 'Keep this change (advance the baseline)';
    accept.addEventListener('click', () => {
      // Accept advances the baseline; the live doc is unchanged.
      app.baselineMd = acceptHunk(app.baselineMd, currentMarkdown(app.ed), h.index);
      rerender(app);
    });
    li.appendChild(accept);

    const reject = document.createElement('button');
    reject.className = 'btn btn-reject';
    reject.textContent = 'Reject';
    reject.title = 'Revert this change in the document';
    reject.addEventListener('click', () => {
      // Reject rewrites the live doc back to the baseline for this span.
      const reverted = rejectHunk(app.baselineMd, currentMarkdown(app.ed), h.index);
      loadMarkdown(app.ed, reverted);
      rerender(app);
    });
    li.appendChild(reject);

    host.appendChild(li);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const editorRoot = document.getElementById('editor');
  if (editorRoot) editorRoot.textContent = `Failed to start: ${String(err)}`;
});
