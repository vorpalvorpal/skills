/**
 * Sample documents + sample comment store for the read/write-view demo and the
 * integration tests.
 *
 * `OLD_MD` is the previous version, `NEW_MD` is "Claude's edit". They differ in
 * the body (an insertion and a deletion) and both carry a `:mark` comment anchor,
 * so the demo exercises every read-view feature: insert decoration, delete widget,
 * and a sidebar thread. Comment *bodies* are no longer in the document — they live
 * in the sidecar store; `SAMPLE_THREADS` is the offline stand-in the GUI shows
 * when no dev-server `/threads` endpoint is reachable (a static build / fresh
 * checkout), keyed to the `#t1` anchor.
 *
 * Body diff:
 *   - inserted: "brown " before "fox"  (one inserted word)
 *   - deleted:  "lazy "  before "dog"  (one deleted word)
 */
import type { StoreThread } from './threads-client';

export const OLD_MD = [
  '# Field notes',
  '',
  'The quick fox jumped over the lazy dog while we watched from the',
  'ridge with a :mark[questionable claim]{#t1} about its speed.',
  '',
  '- observed at dawn',
  '- weather was clear',
].join('\n');

export const NEW_MD = [
  '# Field notes',
  '',
  'The quick brown fox jumped over the dog while we watched from the',
  'ridge with a :mark[questionable claim]{#t1} about its speed.',
  '',
  '- observed at dawn',
  '- weather was clear',
].join('\n');

/** Offline stand-in for the `/threads` store, keyed to the `#t1` anchor. */
export const SAMPLE_THREADS: StoreThread[] = [
  {
    id: 't1',
    comments: [
      {
        seq: 1,
        author: 'rjs',
        created: '2026-06-29T09:00:00.000Z',
        body: 'Source for the speed claim?',
      },
      {
        seq: 2,
        author: 'C',
        created: '2026-06-29T09:05:00.000Z',
        body: 'Added — see field log p.4.',
      },
    ],
  },
];
