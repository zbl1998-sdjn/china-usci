// usci — parse and verify the 18-character Unified Social Credit Identifier
// printed on every mainland Chinese business licence.
//
// Public surface only. Implementation lives in three files, split so each can be
// audited on its own:
//   tables.js  data transcribed from GB 32100-2015 and GB/T 2260, no logic
//   lookup.js  table reads for the authority, category and province
//   parse.js   normalisation, check-character arithmetic, and the full parse
//
// Everything is a pure function. No DOM, no network, no I/O — a code passed in
// never leaves the caller's machine.
//
// The rule that shapes the whole package: a successful parse returns `proves` AND
// `doesNotProve`, and callers must not drop the second one. A checker that only
// says "valid" manufactures false confidence — someone reads a green tick and
// concludes the company is fine. It isn't; a correctly formed code can be invented.
//
// Algorithm: GB 32100-2015《法人和其他组织统一社会信用代码编码规则》, in force
// since 2015-10-01. The weights and character set were transcribed from the
// standard's full text on Wikisource, not from an official PDF; see README for
// the two checks run against that risk, including 2149 real government-published
// codes parsed at a 100% pass rate.

export { parseUsci, isWellFormed, normalise, checkCharacterFor } from './parse.js';
export { authorityFor, categoryFor, provinceFor } from './lookup.js';
export {
  CHARSET as USCI_CHARSET,
  WEIGHTS as USCI_WEIGHTS,
  DOES_NOT_PROVE as USCI_DOES_NOT_PROVE
} from './tables.js';
