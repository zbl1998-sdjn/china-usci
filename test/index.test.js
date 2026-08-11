import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  parseUsci,
  isWellFormed,
  normalise,
  checkCharacterFor,
  authorityFor,
  categoryFor,
  provinceFor,
  USCI_CHARSET,
  USCI_WEIGHTS,
  USCI_DOES_NOT_PROVE
} from '../src/index.js';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/official-codes.json', import.meta.url)), 'utf8')
);

// ── The constants ───────────────────────────────────────────────────────────
// These matter more than the rest: they were transcribed from a Wikisource copy
// of GB 32100-2015 rather than an official PDF, so they get checked two ways —
// arithmetically here, and against real government-issued codes further down.

test('weights match Wi = 3^(i-1) mod 31, term by term', () => {
  for (let i = 1; i <= 17; i += 1) {
    const expected = Number(3n ** BigInt(i - 1) % 31n);
    assert.equal(USCI_WEIGHTS[i - 1], expected, `weight ${i}`);
  }
  assert.equal(USCI_WEIGHTS.length, 17);
});

test('character set is the 31 permitted characters and excludes I, O, Z, S, V', () => {
  assert.equal(USCI_CHARSET.length, 31);
  assert.equal(new Set(USCI_CHARSET).size, 31, 'no duplicates');
  for (const c of 'IOZSV') {
    assert.ok(!USCI_CHARSET.includes(c), `${c} must be excluded`);
  }
  assert.equal(USCI_CHARSET.slice(0, 10), '0123456789', 'digits keep their numeric value');
});

// ── Real codes ──────────────────────────────────────────────────────────────

test(`${fixture.count} real codes from a Chinese government PDF all pass`, () => {
  assert.ok(fixture.count >= 50, 'fixture should not silently shrink');
  const failures = fixture.codes.filter((c) => parseUsci(c).status !== 'ok');
  assert.deepEqual(failures, [], 'every officially issued code must parse as ok');
});

test('real codes stay valid after realistic mangling of case and spacing', () => {
  for (const code of fixture.codes.slice(0, 10)) {
    const spaced = `${code.slice(0, 6)} ${code.slice(6, 12)} ${code.slice(12)}`;
    assert.equal(parseUsci(spaced.toLowerCase()).status, 'ok', code);
  }
});

test('flipping any single character of a real code is caught', () => {
  // Single-substitution detection is the property a mod-31 check digit guarantees.
  const code = fixture.codes[0];
  let checked = 0;
  for (let i = 0; i < 17; i += 1) {
    for (const c of USCI_CHARSET) {
      if (c === code[i]) continue;
      const mutated = code.slice(0, i) + c + code.slice(i + 1);
      assert.notEqual(parseUsci(mutated).status, 'ok', mutated);
      checked += 1;
    }
  }
  assert.equal(checked, 17 * 30);
});

// ── Parsing ─────────────────────────────────────────────────────────────────

test('check character is recomputed, not read back', () => {
  const code = fixture.codes[0];
  assert.equal(checkCharacterFor(code.slice(0, 17)), code[17]);
  assert.equal(checkCharacterFor('too short'), null);
  assert.equal(checkCharacterFor('9'.repeat(16) + 'I'), null, 'excluded character');
});

test('a wrong check character reports both expected and actual', () => {
  const code = fixture.codes[0];
  const wrong = USCI_CHARSET[(USCI_CHARSET.indexOf(code[17]) + 1) % 31];
  const r = parseUsci(code.slice(0, 17) + wrong);
  assert.equal(r.status, 'check-failed');
  assert.equal(r.expectedCheckCharacter, code[17]);
  assert.equal(r.actualCheckCharacter, wrong);
});

test('normalise tolerates spaces, full-width spaces, hyphens and lower case', () => {
  assert.equal(normalise(' 91 1103-02 6000 2492xa '), '9111030260002492XA');
  assert.equal(normalise('91　110302'), '91110302');
  assert.equal(normalise(null), '');
  assert.equal(normalise(undefined), '');
});

test('excluded characters get a specific message, not a generic format error', () => {
  const r = parseUsci('9111O30260002492XA');
  assert.equal(r.status, 'bad-characters');
  assert.ok(r.illegal.includes('O'));
  assert.match(r.message, /excludes I, O, Z, S and V/);
});

test('wrong length and empty input are distinguished', () => {
  assert.equal(parseUsci('').status, 'empty');
  assert.equal(parseUsci('   ').status, 'empty');
  assert.equal(parseUsci('911103026000249').status, 'bad-length');
  assert.match(parseUsci('911103026000249').message, /has 15/);
});

test('segments cover all 18 characters exactly once, in order', () => {
  const { segments } = parseUsci(fixture.codes[0]);
  assert.equal(segments.map((s) => s.value).join(''), fixture.codes[0]);
  let cursor = 0;
  for (const s of segments) {
    assert.equal(s.start, cursor);
    cursor = s.end;
  }
  assert.equal(cursor, 18);
});

// ── Lookups ─────────────────────────────────────────────────────────────────

test('9-1 is an enterprise and 9-2 is an individually-owned business', () => {
  assert.equal(categoryFor('9', '1').en, 'Enterprise');
  assert.equal(categoryFor('9', '1').isIndividualBusiness, false);
  assert.equal(categoryFor('9', '2').en, 'Individually-owned business');
  assert.equal(categoryFor('9', '2').isIndividualBusiness, true);
  assert.equal(categoryFor('9', '2').zh, '个体工商户');
});

test('unknown authority or category returns null rather than guessing', () => {
  assert.equal(authorityFor('Q'), null);
  assert.equal(authorityFor(''), null);
  assert.equal(categoryFor('9', '7'), null);
  assert.equal(categoryFor('Q', '1'), null);
});

test('province resolves from the division prefix, and only to province level', () => {
  assert.deepEqual(provinceFor('310113'), { province: 'Shanghai', mainland: true });
  assert.deepEqual(provinceFor('37'), { province: 'Shandong', mainland: true });
  assert.equal(provinceFor('990000'), null, 'unknown prefix returns null, not a guess');
});

test('Taiwan, Hong Kong and Macau prefixes are flagged as not SAMR-registered', () => {
  for (const [prefix, name] of [['710000', 'Taiwan'], ['810000', 'Hong Kong SAR'], ['820000', 'Macau SAR']]) {
    assert.deepEqual(provinceFor(prefix), { province: name, mainland: false });
  }
});

// ── The contract that makes this safe to hand to a buyer ─────────────────────

test('every parsed result carries doesNotProve, and it is never empty', () => {
  const code = fixture.codes[0];
  const wrong = USCI_CHARSET[(USCI_CHARSET.indexOf(code[17]) + 1) % 31];
  for (const input of [code, code.slice(0, 17) + wrong]) {
    const r = parseUsci(input);
    assert.ok(Array.isArray(r.doesNotProve), `${r.status} must carry doesNotProve`);
    assert.equal(r.doesNotProve.length, 5);
    assert.deepEqual(r.doesNotProve, USCI_DOES_NOT_PROVE);
  }
});

test('a passing result never claims the code is "valid"', () => {
  // Wording is load-bearing: "valid" gets read as "this company is fine".
  const r = parseUsci(fixture.codes[0]);
  const joined = r.proves.join(' ').toLowerCase();
  assert.ok(joined.includes('transcribed correctly'));
  assert.ok(!/\bvalid\b/.test(joined), 'must not say "valid"');
});

test('doesNotProve does not tie export eligibility to entity type', () => {
  // Corrected 2026-08-08: individually-owned businesses can and do export.
  const joined = USCI_DOES_NOT_PROVE.join(' ');
  assert.match(joined, /Export eligibility turns on the registered scope and customs registration/);
});

test('isWellFormed agrees with parseUsci but drops the reasons', () => {
  assert.equal(isWellFormed(fixture.codes[0]), true);
  assert.equal(isWellFormed('9111030260002492XB'), false);
  assert.equal(isWellFormed(''), false);
});
