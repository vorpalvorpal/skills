/**
 * docloop read view (M1) entry point.
 *
 * Wires the three read-view features over a headless-but-mounted Milkdown
 * editor:
 *   1. load NEW_MD (canonicalised via roundTrip on import — see createEditor),
 *   2. paint the diff vs OLD_MD as ProseMirror decorations (green inserts,
 *      red strike-through delete widgets),
 *   3. highlight each <mark> comment anchor and list the threads in a sidebar,
 *      cross-linked by a badge number.
 *
 * Everything is read-only; editing actions are M2.
 */
import { DecorationSet } from '@milkdown/prose/view';
import { createEditor } from './editor';
import { buildReadViewDecorations } from './decorations';
import { decorationPlugin, decoPluginKey } from './deco-plugin';
import { extractThreads, type Thread } from './threads';
import { OLD_MD, NEW_MD } from './sample';

async function main(): Promise<void> {
  const editorRoot = document.getElementById('editor');
  const threadList = document.getElementById('threads');
  if (!editorRoot || !threadList) throw new Error('missing #editor / #threads');

  // 1. Editor with NEW_MD. The decoration plugin starts empty; we fill it once
  //    the doc (and thus its positions) exists. Registering empty-then-updating
  //    sidesteps the chicken/egg of needing the doc to compute decorations.
  const ed = await createEditor(editorRoot, NEW_MD, {
    plugins: [decorationPlugin(DecorationSet.empty)],
  });

  // 2. Diff vs OLD_MD → decorations, mapped to ProseMirror positions by diffing
  //    the two docs' body text content (not the markdown string).
  const oldDoc = ed.parse(OLD_MD);
  const newDoc = ed.view.state.doc;
  const decorations = buildReadViewDecorations(oldDoc, newDoc);

  // Push the set into the live plugin via its meta channel.
  ed.view.dispatch(ed.view.state.tr.setMeta(decoPluginKey, decorations));

  // 3. Sidebar: threads from NEW_MD, in document order, badge-numbered to match
  //    the in-doc <mark> highlights (extractThreads and findMarkHighlights both
  //    walk in document order, so the Nth thread === the Nth highlight).
  renderThreads(threadList, extractThreads(NEW_MD));
}

function renderThreads(host: HTMLElement, threads: Thread[]): void {
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
    badge.textContent = String(i + 1); // 1-based, matches the in-doc badge
    head.appendChild(badge);

    const anchor = document.createElement('span');
    anchor.className = 'thread-anchor';
    anchor.textContent = `“${t.anchor}”`;
    head.appendChild(anchor);
    li.appendChild(head);

    const body = document.createElement('div');
    if (t.body === null) {
      body.className = 'thread-orphan';
      body.textContent = '(orphan anchor — no thread body)';
    } else {
      body.className = 'thread-body';
      body.textContent = t.body;
    }
    li.appendChild(body);

    host.appendChild(li);
  });
}

main().catch((err) => {
  // Surface boot failures visibly rather than only in the console.
  // eslint-disable-next-line no-console
  console.error(err);
  const editorRoot = document.getElementById('editor');
  if (editorRoot) {
    editorRoot.textContent = `Failed to start read view: ${String(err)}`;
  }
});
