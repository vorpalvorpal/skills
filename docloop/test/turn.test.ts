import { describe, it, expect } from 'vitest';
import { renderTurn } from '../src/turn';
import type { Thread } from '../src/threads-store';
import { OLD_MD, NEW_MD } from '../src/sample';

// A store shaped like threads-store.ts `listThreads()` output, keyed to the
// sample's `#t1` anchor.
const STORE: Thread[] = [
  {
    id: 't1',
    comments: [
      { seq: 1, author: 'rjs', created: 'x', body: 't1 open.' },
      { seq: 2, author: 'rjs', created: 'x', body: 'source for the speed claim?' },
    ],
  },
];

describe('renderTurn (M3 LLM-facing turn render)', () => {
  it('emits a <turn> with threads before edits (open items first)', () => {
    const xml = renderTurn(OLD_MD, NEW_MD, STORE);
    expect(xml.startsWith('<turn>')).toBe(true);
    expect(xml.trimEnd().endsWith('</turn>')).toBe(true);
    expect(xml.indexOf('<threads')).toBeLessThan(xml.indexOf('<edits'));
  });

  it('renders the body diff as <ins>/<del>, grouped under the heading', () => {
    const xml = renderTurn(OLD_MD, NEW_MD, STORE);
    // The sample inserts "brown " and deletes "lazy " under "# Field notes".
    expect(xml).toContain('<section heading="Field notes">');
    expect(xml).toMatch(/<ins>brown\s*<\/ins>/);
    expect(xml).toMatch(/<del>lazy\s*<\/del>/);
  });

  it('joins the anchor with its store comments as replies', () => {
    const xml = renderTurn(OLD_MD, NEW_MD, STORE);
    expect(xml).toContain('<thread id="t1" anchor="questionable claim">');
    expect(xml).toContain('<reply>t1 open.</reply>');
    expect(xml).toContain('<reply>source for the speed claim?</reply>');
  });

  it('keeps store comment bodies out of the edits group', () => {
    // A reply mentioning unique text must never surface as a document edit —
    // comments are not document content.
    const store: Thread[] = [
      { id: 't1', comments: [{ seq: 1, author: 'rjs', created: 'x', body: 'see field log p.4' }] },
    ];
    const xml = renderTurn(OLD_MD, NEW_MD, store);
    const edits = xml.slice(xml.indexOf('<edits'));
    expect(edits).not.toContain('field log');
  });

  it('renders an anchor with no store thread as a reply-less <thread>', () => {
    // The lazy-create path: the anchor exists before its first reply.
    const xml = renderTurn(OLD_MD, NEW_MD, []);
    expect(xml).toContain('<thread id="t1" anchor="questionable claim"></thread>');
  });

  it('groups edits by their enclosing heading', () => {
    const oldMd = ['# A', '', 'one two three', '', '## B', '', 'four five six'].join('\n');
    const newMd = ['# A', '', 'one X three', '', '## B', '', 'four five Y six'].join('\n');
    const xml = renderTurn(oldMd, newMd);
    const aIdx = xml.indexOf('<section heading="A">');
    const bIdx = xml.indexOf('<section heading="B">');
    expect(aIdx).toBeGreaterThan(-1);
    expect(bIdx).toBeGreaterThan(aIdx);
    expect(xml).toMatch(/<ins>\s*X\s*<\/ins>/);
    expect(xml).toMatch(/<ins>\s*Y\s*<\/ins>/);
  });

  it('unwraps anchor directives: editing a marked span shows plain text, not the directive', () => {
    const oldMd = 'Body with a :mark[good claim]{#t1} here.';
    const newMd = 'Body with a :mark[great claim]{#t1} here.';
    const xml = renderTurn(oldMd, newMd);
    const edits = xml.slice(xml.indexOf('<edits'));
    expect(edits).not.toContain('mark'); // no :mark scaffolding
    expect(edits).not.toContain('{#'); // no directive id
    expect(edits).toMatch(/<ins>great\s*<\/ins>/);
    expect(edits).toMatch(/<del>good\s*<\/del>/);
  });

  it('emits self-closed groups when there are no threads / no edits', () => {
    const md = ['# Title', '', 'unchanged body text'].join('\n');
    const xml = renderTurn(md, md);
    expect(xml).toContain('<threads/>');
    expect(xml).toContain('<edits/>');
  });

  it('XML-escapes content', () => {
    const oldMd = '# H\n\nplain text here';
    const newMd = '# H\n\nplain text <b> & "q" here';
    const xml = renderTurn(oldMd, newMd);
    expect(xml).toContain('&lt;b&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).not.toMatch(/<ins>[^<]*<b>/); // raw tag never leaks into output
  });
});
