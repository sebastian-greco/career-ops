#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, dirname, join, resolve } from 'path';

function usage() {
  console.log(`Usage:
  node verify-rxresume-pdf.mjs <resume.pdf> [--expected-text <text>]...

Verifies a one-page RxResume PDF, extracts its text, and renders a PNG for visual review.
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const expectedText = [];
  let pdfPath = '';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--expected-text') {
      const value = args[index + 1];
      if (!value) throw new Error('--expected-text requires a value');
      expectedText.push(value);
      index += 1;
      continue;
    }
    if (!pdfPath) {
      pdfPath = resolve(arg);
      continue;
    }
    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!pdfPath) {
    usage();
    process.exit(1);
  }

  return { pdfPath, expectedText };
}

function requireCommand(command) {
  try {
    execFileSync('command', ['-v', command], { shell: true, stdio: 'ignore' });
  } catch {
    throw new Error(`Missing required PDF tool: ${command}`);
  }
}

function main() {
  const { pdfPath, expectedText } = parseArgs(process.argv);
  if (!existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);

  requireCommand('pdfinfo');
  requireCommand('pdftotext');
  requireCommand('pdftoppm');

  const signature = readFileSync(pdfPath).subarray(0, 5).toString('ascii');
  if (signature !== '%PDF-') throw new Error('File does not have a valid PDF signature');

  const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  const pageCount = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1]);
  if (!Number.isInteger(pageCount)) throw new Error('Could not determine PDF page count');

  const qaDir = join(dirname(pdfPath), 'qa');
  mkdirSync(qaDir, { recursive: true });
  const stem = basename(pdfPath, '.pdf');
  const textPath = join(qaDir, `${stem}.txt`);
  const previewPrefix = join(qaDir, stem);
  const previewPath = `${previewPrefix}.png`;

  execFileSync('pdftotext', ['-layout', pdfPath, textPath]);
  execFileSync('pdftoppm', ['-f', '1', '-singlefile', '-png', '-r', '150', pdfPath, previewPrefix]);

  const text = readFileSync(textPath, 'utf8');
  if (text.trim().length < 100) throw new Error('Extracted PDF text is unexpectedly short');

  const missingExpectedText = expectedText.filter(
    (expected) => !text.toLocaleLowerCase().includes(expected.toLocaleLowerCase()),
  );

  const result = {
    ok: pageCount === 1 && missingExpectedText.length === 0,
    pdfPath,
    pageCount,
    textPath,
    previewPath,
    extractedCharacters: text.length,
    missingExpectedText,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
