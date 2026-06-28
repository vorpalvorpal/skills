import { describe, it, expect } from 'vitest';
import { computeDiff, type DiffSegment } from '../src/diff';

const joined = (segs: DiffSegment[], type: DiffSegment['type']) =>
  segs.filter((s) => s.type === type).map((s) => s.value).join('');

describe('computeDiff', () => {
  it('marks inserted words as insert segments', () => {
    const segs = computeDiff('the quick fox', 'the quick brown fox');
    expect(joined(segs, 'insert')).toContain('brown');
    expect(joined(segs, 'delete')).toBe('');
  });

  it('marks deleted words as delete segments', () => {
    const segs = computeDiff('the quick brown fox', 'the quick fox');
    expect(joined(segs, 'delete')).toContain('brown');
    expect(joined(segs, 'insert')).toBe('');
  });

  it('reconstructs each side from its segments (equal+delete = old, equal+insert = new)', () => {
    const oldMd = 'the quick brown fox';
    const newMd = 'the quick red fox';
    const segs = computeDiff(oldMd, newMd);
    expect(joined(segs, 'equal') + joined(segs, 'delete')).not.toBe(''); // sanity
    // old text = equal+delete in order; new text = equal+insert in order
    const oldFromSegs = segs.filter((s) => s.type !== 'insert').map((s) => s.value).join('');
    const newFromSegs = segs.filter((s) => s.type !== 'delete').map((s) => s.value).join('');
    expect(oldFromSegs).toBe(oldMd);
    expect(newFromSegs).toBe(newMd);
  });

  it('ignores changes in the foot-region (at/below the final `---`)', () => {
    const oldMd = 'Body text.\n\n---\n\n<article data-thread="t1">old thread</article>';
    const newMd = 'Body text.\n\n---\n\n<article data-thread="t1">new thread, edited</article>';
    const segs = computeDiff(oldMd, newMd);
    expect(joined(segs, 'insert')).toBe('');
    expect(joined(segs, 'delete')).toBe('');
  });
});
