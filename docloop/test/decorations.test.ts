import { describe, it, expect, afterEach } from 'vitest';
import { DecorationSet } from '@milkdown/prose/view';
import {
  buildBodyTextIndex,
  buildDiffDecorations,
  buildReadViewDecorations,
  findMarkHighlights,
} from '../src/decorations';
import { decorationPlugin, decoPluginKey } from '../src/deco-plugin';
import { createEditor, type DocloopEditor } from '../src/editor';
import { OLD_MD, NEW_MD } from '../src/sample';

// jsdom integration test (M1): a real headless Milkdown editor holds NEW_MD; we
// diff it against OLD_MD and assert the decoration set the read view will draw.

let ed: DocloopEditor | null = null;
afterEach(async () => {
  await ed?.destroy();
  ed = null;
});

describe('diff decorations (integration)', () => {
  it('body text index covers the whole document, tags/punctuation excluded', async () => {
    const root = document.createElement('div');
    ed = await createEditor(root, NEW_MD);
    const idx = buildBodyTextIndex(ed.view.state.doc);
    expect(idx.text).toContain('brown fox'); // body content present
    expect(idx.text).toContain('questionable claim'); // the anchored span's text
    expect(idx.text).not.toContain(':mark'); // directive punctuation not in text
    expect(idx.text).not.toContain('{#t1}');
  });

  it('builds one inline insert decoration and one delete widget for a 1-word-in/1-word-out edit', async () => {
    const root = document.createElement('div');
    ed = await createEditor(root, NEW_MD);
    const oldDoc = ed.parse(OLD_MD);
    const set = buildDiffDecorations(oldDoc, ed.view.state.doc);

    // Both insert (inline) and delete (widget) decorations carry a stable
    // spec.key so we can classify them without reaching into PM internals
    // (inline attrs live in d.type.attrs, not d.spec).
    const all = set.find();
    const keyOf = (d: (typeof all)[number]) => String((d.spec as any)?.key ?? '');
    const inserts = all.filter((d) => keyOf(d).startsWith('ins-'));
    const deletes = all.filter((d) => keyOf(d).startsWith('del-'));

    // "brown" inserted before "fox" -> exactly one inserted-word segment.
    expect(inserts.length).toBe(1);
    // "lazy" deleted before "dog" -> exactly one deleted-word widget.
    expect(deletes.length).toBe(1);

    // The insert decoration must actually cover the inserted text in the doc.
    const ins = inserts[0];
    const covered = ed.view.state.doc.textBetween(ins.from, ins.to);
    expect(covered).toContain('brown');
  });

  it('finds the comment-anchor span and numbers it', async () => {
    const root = document.createElement('div');
    ed = await createEditor(root, NEW_MD);
    const marks = findMarkHighlights(ed.view.state.doc);
    expect(marks.length).toBe(1);
    expect(marks[0].id).toBe('t1');
    expect(marks[0].index).toBe(1);
    const anchorText = ed.view.state.doc.textBetween(marks[0].from, marks[0].to);
    expect(anchorText).toBe('questionable claim');
  });

  it('end-to-end: the deco plugin paints insert/delete/mark classes into the read-only view', async () => {
    // This is the exact path main.ts drives: register the plugin empty, then
    // push the full read-view set via its meta channel after the doc exists.
    const root = document.createElement('div');
    ed = await createEditor(root, NEW_MD, {
      plugins: [decorationPlugin(DecorationSet.empty)],
    });
    const oldDoc = ed.parse(OLD_MD);
    const set = buildReadViewDecorations(oldDoc, ed.view.state.doc);
    ed.view.dispatch(ed.view.state.tr.setMeta(decoPluginKey, set));

    // The plugin's `decorations` prop now returns the live set (>=3: ins+del+mark).
    const live = decoPluginKey.getState(ed.view.state)!;
    expect(live.find().length).toBeGreaterThanOrEqual(3);

    // ...and ProseMirror rendered those decorations into the DOM, read-only.
    const html = ed.view.dom.innerHTML;
    expect(html).toContain('docloop-ins'); // green insert span
    expect(html).toContain('docloop-del'); // red strikethrough delete widget
    expect(html).toContain('docloop-mark'); // comment-anchor highlight
    expect(ed.view.dom.getAttribute('contenteditable')).toBe('false');
  });
});
