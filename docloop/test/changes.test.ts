import { describe, it, expect, afterEach } from 'vitest';
import { createEditor, type DocloopEditor } from '../src/editor';
import { listChanges, rejectChange } from '../src/changes';

// The change-review model runs on a real headless editor: the live doc is the
// editor's doc, the baseline is parsed with the same parser.

let ed: DocloopEditor | null = null;
afterEach(async () => {
  await ed?.destroy();
  ed = null;
});

async function live(md: string): Promise<DocloopEditor> {
  ed = await createEditor(document.createElement('div'), md, { editable: true });
  return ed;
}

describe('listChanges', () => {
  it('groups an adjacent delete+insert into one replace, positioned on the new text', async () => {
    const e = await live('The dog sat.');
    const changes = listChanges(e.parse('The cat sat.'), e.view.state.doc);
    expect(changes.length).toBe(1);
    expect(changes[0].type).toBe('replace');
    expect(changes[0].oldValue.trim()).toBe('cat');
    expect(changes[0].newValue.trim()).toBe('dog');
    expect(e.view.state.doc.textBetween(changes[0].from, changes[0].to)).toContain('dog');
  });

  it('bridges a short retained gap into one replace', async () => {
    const e = await live('the dog sat on the rug');
    const changes = listChanges(e.parse('the cat sat on the mat'), e.view.state.doc);
    expect(changes.length).toBe(1);
    expect(changes[0].oldValue).toContain('cat sat on the mat');
    expect(changes[0].newValue).toContain('dog sat on the rug');
  });

  it('lists a pure insert with a span over the inserted text', async () => {
    const e = await live('the quick brown fox');
    const changes = listChanges(e.parse('the quick fox'), e.view.state.doc);
    expect(changes.map((c) => c.type)).toEqual(['insert']);
    expect(e.view.state.doc.textBetween(changes[0].from, changes[0].to)).toContain('brown');
  });

  it('opening a comment thread is not a change (text content unchanged)', async () => {
    const e = await live('A :mark[flag]{#t1} here.');
    expect(listChanges(e.parse('A flag here.'), e.view.state.doc)).toEqual([]);
  });
});

describe('rejectChange', () => {
  it('reject(insert) removes the inserted text', async () => {
    const e = await live('the quick brown fox');
    const [ins] = listChanges(e.parse('the quick fox'), e.view.state.doc);
    rejectChange(e.view, ins);
    expect(e.view.state.doc.textContent).toBe('the quick fox');
  });

  it('reject(replace) swaps back to the baseline text', async () => {
    const e = await live('The dog sat.');
    const [rep] = listChanges(e.parse('The cat sat.'), e.view.state.doc);
    rejectChange(e.view, rep);
    expect(e.view.state.doc.textContent).toBe('The cat sat.');
  });

  it('reject(delete) restores the removed text', async () => {
    const e = await live('the quick fox');
    const [del] = listChanges(e.parse('the quick brown fox'), e.view.state.doc);
    expect(del.type).toBe('delete');
    rejectChange(e.view, del);
    expect(e.view.state.doc.textContent).toBe('the quick brown fox');
  });
});
