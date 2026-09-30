// The standard's own worked example (GB 32100-2015, Appendix B) kept next to the code.
// Read on 2026-09-30 from a copy of the China Standards Press second edition (July 2016,
// with Amendment No. 1) hosted on Wikimedia Commons; the numbers below are the ones printed there.
import assert from 'node:assert/strict';
import test from 'node:test';
import { USCI_CHARSET, USCI_WEIGHTS, checkCharacterFor, parseUsci } from '../src/index.js';

const FIRST_17 = '91350100M000100Y4';

test('Appendix B: character values, weights and products', () => {
  const values = [...FIRST_17].map((c) => USCI_CHARSET.indexOf(c));
  assert.deepEqual(values, [9, 1, 3, 5, 0, 1, 0, 0, 21, 0, 0, 0, 1, 0, 0, 30, 4]);
  assert.deepEqual(USCI_WEIGHTS, [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]);
  const products = values.map((v, i) => v * USCI_WEIGHTS[i]);
  assert.deepEqual(products, [9, 3, 27, 135, 0, 26, 0, 0, 420, 0, 0, 0, 8, 0, 0, 900, 112]);
  const sum = products.reduce((a, b) => a + b, 0);
  assert.equal(sum, 1640);
  assert.equal(sum % 31, 28);
  assert.equal(31 - (sum % 31), 3);
});

test('Appendix B: the full code is 91350100M000100Y43 and passes', () => {
  assert.equal(checkCharacterFor(FIRST_17), '3');
  const r = parseUsci(FIRST_17 + '3');
  assert.equal(r.status, 'ok');
  assert.equal(r.checkCharacter, '3');
});

test('the special results: a remainder of 0 is written 0 and a remainder of 1 is written Y', () => {
  assert.equal(parseUsci('91330106MA27XNEXG0').status, 'ok');
  assert.equal(parseUsci('91330106MA27XNEXTY').status, 'ok');
  assert.equal(checkCharacterFor('91330106MA27XNEXG'), '0');
  assert.equal(checkCharacterFor('91330106MA27XNEXT'), 'Y');
});

test('the CLI wording does not claim the code was copied correctly', async () => {
  const { readFileSync } = await import('node:fs');
  const cli = readFileSync(new URL('../bin/cli.js', import.meta.url), 'utf8');
  assert.ok(!cli.includes('transcribed correctly'));
  assert.ok(cli.includes('check character consistent'));
});
