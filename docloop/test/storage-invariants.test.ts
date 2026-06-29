import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { roundTrip } from '../src/roundtrip';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(join(here, 'fixtures', 'roundtrip.md'), 'utf8');

// NEW tests (not the M0 gate) — they ADD coverage for docloop-specific storage
// invariants discovered during M0. They must never replace the gate in
// roundtrip.test.ts; they only pin extra guarantees the storage scheme relies on.
describe('docloop storage invariants (supplementary to the M0 gate)', () => {
  it('keeps a thematic break as a literal `---` (not `***`)', async () => {
    // src/roundtrip.ts pins `rule: '-'`; remark-stringify defaults to `***`.
    // Guard against that pin regressing.
    const out = await roundTrip(fixture);
    expect(out).toMatch(/\n---\n/);
    expect(out).not.toMatch(/\n\*\*\*\n/);
  });

  it('keeps bullet lists on `-` (not `*`)', async () => {
    const out = await roundTrip(fixture);
    expect(out).toMatch(/^- first item$/m);
    expect(out).toMatch(/^- second item$/m);
  });

  it('reaches its fixpoint after exactly one normalisation pass', async () => {
    // Documents the contract precisely: the FIRST pass may normalise; every
    // pass after that is a byte-for-byte no-op.
    const once = await roundTrip(fixture);
    const twice = await roundTrip(once);
    const thrice = await roundTrip(twice);
    expect(twice).toBe(once);
    expect(thrice).toBe(once);
  });

  it('round-trips the anchor directive + raw-HTML diff tags byte-for-byte', async () => {
    // Stronger than the gate's substring checks: the exact anchor + raw-HTML
    // tags must survive verbatim.
    const out = await roundTrip(fixture);
    expect(out).toContain(':mark[commented span]{#t1}');
    expect(out).toContain('<ins>an inserted span</ins>');
    expect(out).toContain('<del>a deleted span</del>');
  });
});
