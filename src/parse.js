// Normalisation, check-character arithmetic, and the full parse.
// Pure functions: no DOM, no network, no I/O. Nothing typed here leaves the machine.

import { CHARSET, WEIGHTS, SEGMENTS, DOES_NOT_PROVE } from './tables.js';
import { authorityFor, categoryFor, provinceFor } from './lookup.js';

/**
 * Strip whitespace and hyphens, upper-case the rest.
 *
 * Codes get copied off PDFs, photos and email signatures, so spaces, full-width
 * spaces, hyphens and lower case are normal input — not format errors.
 * @param {string} input
 * @returns {string}
 */
export function normalise(input) {
  return String(input ?? '').replace(/[\s　-]/g, '').toUpperCase();
}

/**
 * Compute the check character for the first 17 characters.
 * @param {string} first17
 * @returns {string | null} null when the input is not 17 permitted characters.
 */
export function checkCharacterFor(first17) {
  if (first17.length !== 17) return null;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const value = CHARSET.indexOf(first17[i]);
    if (value < 0) return null;
    sum += value * WEIGHTS[i];
  }
  // C18 = 31 - (sum mod 31); when that yields 31 the character is 0.
  // Taking the modulus once more covers both cases.
  return CHARSET[(31 - (sum % 31)) % 31];
}

function describeSegments(code) {
  const authority = authorityFor(code[0]);
  const category = categoryFor(code[0], code[1]);

  return SEGMENTS.map((s) => {
    const value = code.slice(s.start, s.end);

    if (s.key === 'registrationAuthority') {
      return { ...s, value, note: authority ? `${authority.en} (${authority.zh})` : null };
    }
    if (s.key === 'entityCategory') {
      return { ...s, value, note: category ? `${category.en} (${category.zh})` : null };
    }
    if (s.key !== 'administrativeDivision') return { ...s, value };

    const region = provinceFor(value);
    return {
      ...s,
      value,
      // A note appears only when the province resolves. Failing to resolve is not
      // an error: the prefix may be one this table does not carry, or the code may
      // be wrong — and those two are indistinguishable at this layer, so no verdict.
      note: region
        ? region.mainland
          ? `Registered in ${region.province}.`
          : `Prefix maps to ${region.province}, which is not registered by SAMR — a mainland business licence would not carry it.`
        : null
    };
  });
}

/**
 * Parse and verify a Unified Social Credit Identifier.
 *
 * @param {string} input Raw code; whitespace, hyphens and lower case are tolerated.
 * @returns {object} An object whose `status` is one of:
 *   'ok'              — 18 characters, permitted set, check character matches
 *   'empty'           — nothing to parse
 *   'bad-length'      — not 18 characters after normalisation
 *   'bad-characters'  — contains characters outside the permitted set
 *   'check-failed'    — well formed but the check character does not match
 * Both 'ok' and 'check-failed' carry `doesNotProve`.
 */
export function parseUsci(input) {
  const code = normalise(input);

  if (code.length === 0) {
    return { status: 'empty', code, message: 'Enter an 18-character code.' };
  }
  if (code.length !== 18) {
    return {
      status: 'bad-length',
      code,
      message: `A unified social credit code is 18 characters. This one has ${code.length}.`
    };
  }

  const illegal = [...code].filter((c) => CHARSET.indexOf(c) < 0);
  if (illegal.length > 0) {
    // I/O/Z/S/V are the characters the standard deliberately excludes, and so the
    // ones a mistranscription lands on most often. Saying which is more useful
    // than a generic format error.
    const excluded = illegal.filter((c) => 'IOZSV'.includes(c));
    return {
      status: 'bad-characters',
      code,
      illegal: [...new Set(illegal)],
      message: excluded.length
        ? `Contains ${[...new Set(excluded)].join(', ')}. GB 32100-2015 excludes I, O, Z, S and V, so these are usually transcription errors.`
        : `Contains characters outside the permitted set: ${[...new Set(illegal)].join(', ')}.`
    };
  }

  const expected = checkCharacterFor(code.slice(0, 17));
  const actual = code[17];
  const segments = describeSegments(code);

  if (expected !== actual) {
    return {
      status: 'check-failed',
      code,
      segments,
      expectedCheckCharacter: expected,
      actualCheckCharacter: actual,
      message: `Check character should be ${expected}, not ${actual}. The code was mistyped or altered.`,
      proves: [],
      doesNotProve: DOES_NOT_PROVE
    };
  }

  return {
    status: 'ok',
    code,
    segments,
    checkCharacter: actual,
    // Deliberately "transcribed correctly" rather than "valid". "Valid" gets read
    // as "this company is fine", which is exactly the conclusion this must not support.
    proves: [
      'The 18 characters are internally consistent, so the code was transcribed correctly.',
      'The code is formatted as GB 32100-2015 requires.'
    ],
    doesNotProve: DOES_NOT_PROVE
  };
}

/**
 * Convenience predicate. Prefer `parseUsci` — this drops the reasons, and the
 * reasons are the point.
 * @param {string} input
 * @returns {boolean}
 */
export function isWellFormed(input) {
  return parseUsci(input).status === 'ok';
}
