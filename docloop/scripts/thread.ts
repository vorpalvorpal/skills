/**
 * CLI: deterministic anchor/comment operations for Claude's turn, run from
 * `docloop/` against `workspace/doc.md` + `workspace/threads/`:
 *
 *     npm run thread -- new "<exact span>"     # allocates id, anchors, 1st comment (stdin = body)
 *     npm run thread -- reply <id>             # append a comment (stdin = body)
 *     npm run thread -- resolve <id>           # unwrap anchor + delete threads/<id>/
 *
 * Both `new` and `reply` default `--author` to `C` (Claude) — pass
 * `--author <name>` to override. The comment body is read from stdin so it can
 * hold arbitrary Markdown (multiple paragraphs, code fences) without shell
 * quoting gymnastics.
 *
 * The actual logic lives in scripts/thread-actions.ts (kept separate so it's
 * directly unit-testable without going through argv/stdin/process.exit).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newThread, replyThread, resolveThreadCmd, type ThreadPaths } from './thread-actions';

function usage(): never {
  console.error('usage: thread new <needle> [--author C]      (body via stdin)');
  console.error('       thread reply <id> [--author C]         (body via stdin)');
  console.error('       thread resolve <id>');
  process.exit(1);
}

/**
 * Read the comment body from stdin, SYNCHRONOUSLY (fd 0). An async
 * data/end-listener read raced with Node's event loop here: once stdin closed
 * with nothing else ref'd, the process exited mid-await while the headless
 * editor was still doing its (timer-driven) async setup — silently, exit 0, no
 * output. A blocking read sidesteps that class of bug entirely.
 */
function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const [subcommand, ...rest] = process.argv.slice(2);
let author = 'C';
const positional: string[] = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--author') author = rest[++i];
  else positional.push(rest[i]);
}

const workspace = join(process.cwd(), 'workspace');
const docName = process.env.DOCLOOP_DOC ?? 'doc.md';
const paths: ThreadPaths = { docPath: join(workspace, docName), threadsDir: join(workspace, 'threads') };

if (!subcommand) usage();

try {
  if (subcommand === 'new') {
    const [needle] = positional;
    if (!needle) usage();
    const body = readStdin().replace(/\n+$/, '');
    console.log(await newThread(paths, needle, author, body));
  } else if (subcommand === 'reply') {
    const [id] = positional;
    if (!id) usage();
    const body = readStdin().replace(/\n+$/, '');
    const comment = await replyThread(paths, id, author, body);
    console.log(`${id}/${String(comment.seq).padStart(4, '0')}.md`);
  } else if (subcommand === 'resolve') {
    const [id] = positional;
    if (!id) usage();
    await resolveThreadCmd(paths, id);
    console.log(id);
  } else {
    usage();
  }
} catch (err) {
  console.error(`thread ${subcommand}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
