/**
 * The shared Milkdown configuration the whole app (and M0's roundtrip.ts) agree
 * on. Centralising it here means the read-view editor parses/serialises docs
 * exactly the way the M0 gate proved faithful: commonmark + gfm, with the
 * remark-stringify *style* pinned so bullets stay `-` and the foot-region
 * delimiter stays a literal `---`.
 *
 * NOTE: src/roundtrip.ts inlines this same config rather than importing it, on
 * purpose — it is the M0 gate and must not depend on app code. Keep the two in
 * sync; the storage-invariants suite guards the `-`/`---` pins.
 */
import { remarkStringifyOptionsCtx } from '@milkdown/core';
import type { Ctx } from '@milkdown/ctx';

/** Pin remark-stringify so saved markdown matches how a human writes the doc. */
export function configureStringify(ctx: Ctx): void {
  ctx.update(remarkStringifyOptionsCtx, (prev) => ({
    ...prev,
    bullet: '-' as const,
    rule: '-' as const,
    ruleRepetition: 3,
  }));
}
