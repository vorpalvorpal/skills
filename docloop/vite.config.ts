import { defineConfig, type Plugin } from 'vite';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { renderTurn } from './src/turn';

const run = promisify(execFile);

/**
 * Dev-only endpoints that close the doc↔LLM loop (M3). The workspace is a git
 * repo of its OWN, holding a single tracked `doc.md`; **each commit == one turn**
 * (human or Claude). It is separate from this code repo (workspace/ is gitignored).
 *
 *   POST /commit  — body = the document markdown. Renders the turn (the human's
 *                   delta vs the last commit) to `workspace/turn.xml` for Claude
 *                   to read, then writes + commits `doc.md`. The "Hand to Claude".
 *   GET  /doc     — returns `{ current, baseline }` from git so the GUI can (re)load
 *                   real state: current = HEAD's doc.md, baseline = the commit
 *                   before it. After Claude edits + commits, a GUI reload shows
 *                   Claude's changes as diffs against the human's last turn.
 *
 * The hand-off to Claude itself is out of band: Claude (hand-simulating the MCP
 * for this v0 — see the wiki dogfooding note) reads `workspace/turn.xml`, edits
 * `workspace/doc.md`, and commits. The human then reloads the GUI.
 */
function docloopEndpoints(): Plugin {
  const workspace = join(process.cwd(), 'workspace');
  const docPath = join(workspace, 'doc.md');
  const turnPath = join(workspace, 'turn.xml');
  const git = (...args: string[]) => run('git', ['-C', workspace, ...args]);

  /**
   * Ensure the workspace exists and is its OWN git repo. We test for
   * `workspace/.git` directly rather than `git rev-parse`, because this repo lives
   * inside the outer code repo — `rev-parse --git-dir` would happily resolve to
   * the *outer* repo and we'd never initialise the workspace's own one (after
   * which `git add` trips over the outer `.gitignore`).
   */
  const ensureRepo = async () => {
    await mkdir(workspace, { recursive: true });
    const hasOwnRepo = await access(join(workspace, '.git')).then(
      () => true,
      () => false,
    );
    if (!hasOwnRepo) {
      await git('init', '-q');
      await git('config', 'user.email', 'docloop@local');
      await git('config', 'user.name', 'docloop');
    }
  };

  /** A committed revision of doc.md, or null if that rev doesn't exist. */
  const showDoc = async (rev: string): Promise<string | null> => {
    return git('show', `${rev}:doc.md`)
      .then(({ stdout }) => stdout)
      .catch(() => null);
  };

  const readBody = (req: import('node:http').IncomingMessage): Promise<string> =>
    new Promise((resolve) => {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => resolve(body));
    });

  return {
    name: 'docloop-endpoints',
    apply: 'serve', // dev server only — never part of the build or tests
    configureServer(server) {
      const send = (res: import('node:http').ServerResponse, status: number, payload: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(payload));
      };

      // POST /commit — render the turn, then write + commit the doc.
      server.middlewares.use('/commit', (req, res, next) => {
        if (req.method !== 'POST') return next();
        void (async () => {
          try {
            await ensureRepo();
            const newMd = await readBody(req);

            // Render the turn (human's delta vs the last commit) BEFORE committing,
            // so HEAD still points at the previous version. First commit -> diff
            // against empty.
            const prevMd = (await showDoc('HEAD')) ?? '';
            await writeFile(turnPath, renderTurn(prevMd, newMd), 'utf8');

            await writeFile(docPath, newMd, 'utf8');
            await git('add', 'doc.md');
            let committed = true;
            await git('commit', '-q', '-m', `turn @ ${new Date().toISOString()}`).catch(() => {
              committed = false; // nothing staged — no change since the last commit
            });
            const { stdout } = await git('rev-parse', '--short', 'HEAD');
            send(res, 200, { ok: true, committed, commit: stdout.trim() });
          } catch (err) {
            send(res, 500, { ok: false, error: String(err) });
          }
        })();
      });

      // GET /doc — current + baseline from git, for (re)loading the read/write view.
      server.middlewares.use('/doc', (req, res, next) => {
        if (req.method !== 'GET') return next();
        void (async () => {
          try {
            await ensureRepo();
            // current: HEAD's doc.md if any commit exists, else the working file.
            const current =
              (await showDoc('HEAD')) ?? (await readFile(docPath, 'utf8').catch(() => null));
            if (current === null) return send(res, 200, { ok: true, present: false });
            // baseline: the commit before HEAD (null if HEAD is the first commit).
            const baseline = await showDoc('HEAD~1');
            send(res, 200, { ok: true, present: true, current, baseline });
          } catch (err) {
            send(res, 500, { ok: false, error: String(err) });
          }
        })();
      });
    },
  };
}

export default defineConfig({ plugins: [docloopEndpoints()] });
