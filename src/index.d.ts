// Type definitions for usci
// Hand-written rather than generated: the package ships its source unbuilt, so
// there is no compiler step to derive these from, and a small hand-checked file
// is easier to audit than a generated one.

/** Which part of the 18 characters a segment covers. */
export interface UsciSegment {
  key:
    | 'registrationAuthority'
    | 'entityCategory'
    | 'administrativeDivision'
    | 'subjectIdentifier'
    | 'checkCharacter';
  /** Zero-based, inclusive. */
  start: number;
  /** Zero-based, exclusive. */
  end: number;
  label: string;
  value: string;
  /** Present only when the segment could be decoded; null when it could not. */
  note?: string | null;
}

export interface UsciOk {
  status: 'ok';
  code: string;
  segments: UsciSegment[];
  checkCharacter: string;
  /** What a passing code establishes. Deliberately narrow. */
  proves: string[];
  /** What it does not establish. Do not drop these when surfacing a result. */
  doesNotProve: string[];
}

export interface UsciCheckFailed {
  status: 'check-failed';
  code: string;
  segments: UsciSegment[];
  expectedCheckCharacter: string | null;
  actualCheckCharacter: string;
  message: string;
  proves: [];
  doesNotProve: string[];
}

export interface UsciEmpty {
  status: 'empty';
  code: string;
  message: string;
}

export interface UsciBadLength {
  status: 'bad-length';
  code: string;
  message: string;
}

export interface UsciBadCharacters {
  status: 'bad-characters';
  code: string;
  illegal: string[];
  message: string;
}

export type UsciResult =
  | UsciOk
  | UsciCheckFailed
  | UsciEmpty
  | UsciBadLength
  | UsciBadCharacters;

/**
 * Parse and verify a Unified Social Credit Identifier.
 * Whitespace, full-width spaces, hyphens and lower case are tolerated.
 */
export function parseUsci(input: string): UsciResult;

/**
 * True when the code is 18 permitted characters and the check character matches.
 * Prefer `parseUsci` — this drops the reasons, and the reasons are the point.
 */
export function isWellFormed(input: string): boolean;

/** Strip whitespace and hyphens, upper-case the rest. */
export function normalise(input: string): string;

/** Compute the check character for the first 17 characters; null if the input is unusable. */
export function checkCharacterFor(first17: string): string | null;

/** Registering authority for the first character; null when undefined in GB 32100-2015. */
export function authorityFor(code: string): { en: string; zh: string } | null;

/** Entity category for the first two characters; null when undefined. */
export function categoryFor(
  authorityCode: string,
  categoryCode: string
): { en: string; zh: string; isIndividualBusiness: boolean } | null;

/**
 * Province for an administrative division code.
 * `mainland: false` means the prefix belongs to Taiwan, Hong Kong or Macau, which
 * SAMR does not register — such a prefix should not appear on a mainland licence.
 */
export function provinceFor(
  divisionCode: string
): { province: string; mainland: boolean } | null;

/** The 31 permitted characters, in value order. */
export const USCI_CHARSET: string;

/** The 17 weight factors, Wi = 3^(i-1) mod 31. */
export const USCI_WEIGHTS: readonly number[];

/** The five statements a passing code does not establish. */
export const USCI_DOES_NOT_PROVE: readonly string[];
