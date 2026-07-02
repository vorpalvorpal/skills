/**
 * CLI: structural completeness gate, run from `docloop/` against
 * `workspace/doc.md` + `workspace/threads/`:
 *
 *     npm run lint-turn
 *
 * Prints every issue found (not just the first). Exits 1 if any ERROR was
 * found, 0 otherwise (WARNs alone don't fail the gate). Run before committing
 * a turn (see HANDOFF.md).
 */
import { join } from 'node:path';
import { lintTurn } from './lint-turn-core';

const workspace = join(process.cwd(), 'workspace');
const docName = process.env.DOCLOOP_DOC ?? 'doc.md';
const issues = await lintTurn({ docPath: join(workspace, docName), threadsDir: join(workspace, 'threads') });

for (const issue of issues) console.log(`${issue.level}: ${issue.message}`);

const errorCount = issues.filter((i) => i.level === 'ERROR').length;
if (errorCount > 0) {
  console.log(`lint-turn: ${errorCount} error(s), ${issues.length - errorCount} warning(s)`);
  process.exit(1);
}
console.log(issues.length === 0 ? 'lint-turn: clean' : `lint-turn: ${issues.length} warning(s), no errors`);
