/**
 * A Milkdown `$prose` plugin that paints a DecorationSet onto the live editor
 * view. The read view computes its diff + mark decorations once from the loaded
 * doc and hands them here; this plugin just stores them and exposes them via the
 * standard ProseMirror `decorations` prop. A meta-based setter keeps the door
 * open for M2 (recomputing as the doc changes) without a redesign.
 */
import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { DecorationSet } from '@milkdown/prose/view';

export const decoPluginKey = new PluginKey<DecorationSet>('docloop-decorations');

/** Build the plugin. `initial` is the decoration set for the loaded doc. */
export const decorationPlugin = (initial: DecorationSet) =>
  $prose(
    () =>
      new Plugin<DecorationSet>({
        key: decoPluginKey,
        state: {
          init: () => initial,
          // Map decorations through doc changes; a `setDeco` meta replaces them.
          apply(tr, set) {
            const replacement = tr.getMeta(decoPluginKey) as DecorationSet | undefined;
            if (replacement) return replacement;
            return set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return decoPluginKey.getState(state);
          },
        },
      }),
  );
