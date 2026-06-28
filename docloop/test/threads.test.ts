import { describe, it, expect } from 'vitest';
import { extractThreads } from '../src/threads';

describe('extractThreads', () => {
  it('joins a <mark> anchor with its <article> body by data-thread id', () => {
    const md = [
      'A sentence with a <mark data-thread="t1">commented span</mark> in it.',
      '',
      '---',
      '',
      '<article data-thread="t1">the thread body</article>',
    ].join('\n');
    expect(extractThreads(md)).toEqual([
      { id: 't1', anchor: 'commented span', body: 'the thread body' },
    ]);
  });

  it('returns threads in document order of their anchors', () => {
    const md = [
      '<mark data-thread="t2">second</mark> then <mark data-thread="t1">first</mark>.',
      '',
      '---',
      '<article data-thread="t1">b1</article>',
      '<article data-thread="t2">b2</article>',
    ].join('\n');
    expect(extractThreads(md).map((t) => t.id)).toEqual(['t2', 't1']);
  });

  it('reports an orphan mark (no matching article) with body null', () => {
    const md = 'An <mark data-thread="t9">orphan</mark> mark.';
    expect(extractThreads(md)).toEqual([
      { id: 't9', anchor: 'orphan', body: null },
    ]);
  });
});
