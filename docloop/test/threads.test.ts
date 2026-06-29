import { describe, it, expect } from 'vitest';
import { extractAnchors, unwrapAnchor, nextThreadId } from '../src/threads';

describe('extractAnchors', () => {
  it('extracts an inline :mark anchor with its id and span text', () => {
    const md = 'A sentence with a :mark[commented span]{#t1} in it.';
    expect(extractAnchors(md)).toEqual([{ id: 't1', text: 'commented span' }]);
  });

  it('returns anchors in document order', () => {
    const md = ':mark[second]{#t2} then :mark[first]{#t1}.';
    expect(extractAnchors(md).map((a) => a.id)).toEqual(['t2', 't1']);
  });

  it('coalesces same-id pieces of a span split by inline formatting', () => {
    // A span crossing formatting serialises as repeated same-id directives.
    const md = 'see :mark[the]{#t1}:mark[claim]{#t1} here';
    expect(extractAnchors(md)).toEqual([{ id: 't1', text: 'the claim' }]);
  });

  it('reports a container anchor by id with empty text', () => {
    const md = ':::mark{#t9}\n\nA whole block.\n\n:::';
    expect(extractAnchors(md)).toEqual([{ id: 't9', text: '' }]);
  });
});

describe('unwrapAnchor', () => {
  it('unwraps an inline anchor to plain text, leaving others intact', () => {
    const md = 'X :mark[a]{#t1} Y :mark[b]{#t2}.';
    const out = unwrapAnchor(md, 't1');
    expect(out).toBe('X a Y :mark[b]{#t2}.');
  });

  it('unwraps a container anchor to its blocks', () => {
    const md = ':::mark{#t1}\nblock body\n:::';
    expect(unwrapAnchor(md, 't1')).toBe('block body');
  });

  it('unwraps a LATER anchor without swallowing earlier ones', () => {
    // Regression: an id-specific closer `]{#t3}` must not let the body cross t1/t2.
    const md = 'a :mark[one]{#t1} b :mark[two]{#t2} c :mark[three]{#t3} d';
    expect(unwrapAnchor(md, 't3')).toBe('a :mark[one]{#t1} b :mark[two]{#t2} c three d');
    // and the earlier anchors are still individually extractable + unwrappable
    expect(extractAnchors(unwrapAnchor(md, 't3')).map((x) => x.id)).toEqual(['t1', 't2']);
  });
});

describe('nextThreadId', () => {
  it('allocates t1 when nothing is in use', () => {
    expect(nextThreadId([])).toBe('t1');
  });

  it('allocates max+1 across store and anchor ids', () => {
    expect(nextThreadId(['t1', 't3', 't2'])).toBe('t4');
  });

  it('ignores ids that do not match the t<N> scheme', () => {
    expect(nextThreadId(['weird', 't2'])).toBe('t3');
  });
});
