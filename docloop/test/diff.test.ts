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

  it('diffs the whole document (no foot-region is excluded any more)', () => {
    // Threads now live in the sidecar store, so there is nothing to exclude:
    // every change in the string surfaces as a segment.
    const oldMd = 'Body text. A note here.';
    const newMd = 'Body text. A different note here.';
    const segs = computeDiff(oldMd, newMd);
    expect(joined(segs, 'insert')).toContain('different');
  });
});
