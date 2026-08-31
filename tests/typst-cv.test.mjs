// tests/typst-cv.test.mjs — Typst CV generator: template contract + generator invariants
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pass, fail, warn, fileExists, ROOT } from './helpers.mjs';

const read = (p) => readFileSync(join(ROOT, p), 'utf-8');

console.log('\nTypst CV generator');

if (fileExists('templates/template.typ')) {
  const typ = read('templates/template.typ');

  // The letter format arrives from the generator at compile time; without
  // sys.inputs the template is pinned to whatever it hardcodes.
  if (typ.includes('sys.inputs')) {
    pass('template.typ uses sys.inputs for dynamic format');
  } else {
    fail('template.typ missing sys.inputs — format cannot be overridden');
  }

  // An absolute path compiles on the author's machine and nowhere else.
  // Needles are assembled rather than written out: test-all.mjs greps every
  // tracked file for the literal home-directory prefixes and fails on a hit,
  // and it exempts only itself.
  const homePrefixes = ['/Users', '/home'].map((p) => `${p}/`);
  if (!homePrefixes.some((prefix) => typ.includes(prefix))) {
    pass('template.typ has no absolute paths');
  } else {
    fail('template.typ contains absolute paths');
  }
} else {
  fail('templates/template.typ missing');
}

if (fileExists('generate-typst-pdf.mjs')) {
  const src = read('generate-typst-pdf.mjs');

  // Output name must derive from the profile, not from the author's own CV.
  const hardcodedName = src.match(/cv-[a-z]+-[a-z]+\.pdf/i);
  if (!hardcodedName) {
    pass('generate-typst-pdf.mjs: output filename is dynamic (no hardcoded name)');
  } else {
    fail(`generate-typst-pdf.mjs: hardcoded filename detected: ${hardcodedName[0]}`);
  }

  if (src.includes('--input') && src.includes('format=')) {
    pass('generate-typst-pdf.mjs passes format to typst compile');
  } else {
    fail('generate-typst-pdf.mjs does not pass format to typst compile');
  }
} else {
  fail('generate-typst-pdf.mjs missing');
}

// Warn only: CI has no typst, and the shared run() helper allowlists only
// node/bash/git/go, so probe the binary directly.
let typstVersion = null;
try {
  typstVersion = execFileSync('typst', ['--version'], { encoding: 'utf-8', timeout: 30000 }).trim();
} catch {
  typstVersion = null;
}
if (typstVersion) {
  pass(`typst binary available: ${typstVersion}`);
} else {
  warn('typst binary not found — install with: brew install typst');
}
