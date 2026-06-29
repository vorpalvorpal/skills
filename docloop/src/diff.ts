import { diffWords } from 'diff';

export type DiffSegment = {
  type: 'equal' | 'insert' | 'delete';
  value: string;
};

/**
 * Word-level diff of two markdown versions. Since the sidecar refactor the whole
 * document is body — comment threads live in the `threads/<id>/` store, not below
 * a `---` foot-region — so there is nothing to exclude: the entire string diffs.
 *
 * Returns an ordered segment list. The invariant the tests pin:
 *   equal+delete segments, in order, reconstruct the OLD text;
 *   equal+insert segments, in order, reconstruct the NEW text.
 * The GUI maps insert/delete segments to ProseMirror decorations.
 */
export function computeDiff(oldMarkdown: string, newMarkdown: string): DiffSegment[] {
  // diffWords groups runs of unchanged / added / removed words (whitespace is
  // attached so the two sides reconstruct exactly). Map its parts onto our
  // narrower vocabulary.
  return diffWords(oldMarkdown, newMarkdown).map((part): DiffSegment => ({
    type: part.added ? 'insert' : part.removed ? 'delete' : 'equal',
    value: part.value,
  }));
}
