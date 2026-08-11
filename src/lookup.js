// Table lookups for the first two characters and the division code.
// Pure reads against src/tables.js — no parsing, no verdicts.

import { AUTHORITIES, PROVINCE_CODES, NON_MAINLAND_PREFIXES } from './tables.js';

/**
 * Look up the registering authority from the first character.
 * @param {string} code First character, or the whole code.
 * @returns {{en: string, zh: string} | null} null when the character is not a defined authority.
 */
export function authorityFor(code) {
  const a = AUTHORITIES[String(code ?? '').slice(0, 1)];
  return a ? { en: a.en, zh: a.zh } : null;
}

/**
 * Look up the entity category from the first two characters.
 * @param {string} authorityCode First character.
 * @param {string} categoryCode Second character.
 * @returns {{en: string, zh: string, isIndividualBusiness: boolean} | null}
 */
export function categoryFor(authorityCode, categoryCode) {
  const a = AUTHORITIES[String(authorityCode ?? '')];
  const c = a?.categories?.[String(categoryCode ?? '')];
  if (!c) return null;
  return {
    en: c[0],
    zh: c[1],
    // Surfaced as its own flag because it is a commercial judgement, not taxonomy:
    // an individually-owned business is a different kind of counterparty from a company.
    isIndividualBusiness: String(authorityCode) === '9' && String(categoryCode) === '2'
  };
}

/**
 * Resolve the province from an administrative division code.
 * @param {string} divisionCode Six-character division code, or its first two characters.
 * @returns {{province: string, mainland: boolean} | null} null when the prefix is unknown.
 */
export function provinceFor(divisionCode) {
  const prefix = String(divisionCode ?? '').slice(0, 2);
  if (PROVINCE_CODES[prefix]) return { province: PROVINCE_CODES[prefix], mainland: true };
  if (NON_MAINLAND_PREFIXES[prefix]) return { province: NON_MAINLAND_PREFIXES[prefix], mainland: false };
  return null;
}
