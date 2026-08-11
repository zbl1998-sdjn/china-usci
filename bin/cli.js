#!/usr/bin/env node
// usci — command line front end.
//
//   usci 91350100M000100Y43        one code, human-readable
//   usci --json 913501...          one code, machine-readable
//   cat codes.txt | usci           one code per line, tab-separated summary
//
// Exit code is 0 only when every code parsed is 'ok', so it composes in scripts.
// Everything runs locally; nothing is sent anywhere.

import { parseUsci } from '../src/index.js';

const USAGE = `usci — verify the 18-character Unified Social Credit Identifier
             on a Chinese business licence (GB 32100-2015).

Usage
  usci <code>              parse one code
  usci --json <code>       same, as JSON
  usci < codes.txt         one code per line, tab-separated results
  usci --json < codes.txt  the same as a JSON array

Exit code 0 when every code parsed is 'ok', 1 otherwise.

This checks transcription, not the company. A passing code does not show that
the company exists, is still trading, or may legally export to you.`;

// Colour only when a human is looking at it. Honours NO_COLOR (no-color.org).
const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
// ESC is built from its code point so this source file carries no invisible
// control characters. The package is meant to be read before it is trusted.
const ESC = String.fromCharCode(27);
const paint = (code, s) => (useColour ? `${ESC}[${code}m${s}${ESC}[0m` : s);
const green = (s) => paint('32', s);
const red = (s) => paint('31', s);
const dim = (s) => paint('2', s);
const bold = (s) => paint('1', s);

function render(result) {
  const lines = [];

  if (result.status === 'ok') {
    lines.push(`${green('✓')} ${bold(result.code)}  ${dim('transcribed correctly')}`);
  } else {
    lines.push(`${red('✗')} ${bold(result.code || '(empty)')}  ${red(result.status)}`);
    if (result.message) lines.push(`  ${result.message}`);
  }

  for (const s of result.segments ?? []) {
    const pos = `${s.start + 1}-${s.end}`.padEnd(6);
    const value = s.value.padEnd(10);
    lines.push(`  ${dim(pos)} ${value} ${dim(s.label)}${s.note ? ` — ${s.note}` : ''}`);
  }

  // The doesNotProve block is printed for every parsed code, not just failures.
  // It is the reason this tool is safe to hand to someone under time pressure.
  if (result.doesNotProve) {
    lines.push('');
    lines.push(dim('  A passing code does not show:'));
    for (const d of result.doesNotProve) lines.push(dim(`    · ${d}`));
  }

  return lines.join('\n');
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const asJson = args.includes('--json');
  const positional = args.filter((a) => !a.startsWith('-'));

  const codes = positional.length
    ? positional
    : (await readStdin()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (codes.length === 0) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }

  const results = codes.map(parseUsci);

  if (asJson) {
    process.stdout.write(`${JSON.stringify(codes.length === 1 ? results[0] : results, null, 2)}\n`);
  } else if (codes.length === 1) {
    process.stdout.write(`${render(results[0])}\n`);
  } else {
    // Batch mode stays one line per code so it pipes into grep, awk and sort.
    for (const r of results) {
      process.stdout.write(`${r.code}\t${r.status}\t${r.message ?? ''}\n`);
    }
  }

  return results.every((r) => r.status === 'ok') ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`usci: ${err?.message ?? err}\n`);
    process.exit(2);
  }
);
