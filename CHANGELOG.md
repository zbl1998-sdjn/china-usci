# Changelog

All notable changes to this package are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-11

First release.

### Added

- `parseUsci()` — structure parsing and check-character verification against
  GB 32100-2015, returning one of `ok` / `check-failed` / `bad-characters` /
  `bad-length` / `empty`.
- `proves` and `doesNotProve` on every parsed result. The second one is the
  reason this package exists: a checker that only reports "valid" manufactures
  false confidence about a company it never looked up.
- Decoding of the registering authority and entity category, with
  `isIndividualBusiness` surfaced as its own flag — an individually-owned
  business (个体工商户) is a different kind of counterparty from a company, and
  a photo of the licence does not make that obvious.
- Province resolution from the GB/T 2260 division code, deliberately stopping at
  province level; Taiwan, Hong Kong and Macau prefixes flagged as not
  SAMR-registered.
- `isWellFormed()`, `normalise()`, `checkCharacterFor()` and the three table
  lookups as separate exports.
- `usci` CLI: single code, `--json`, and line-oriented stdin for batches.
  Exit code 0 only when every code parsed is `ok`.
- Hand-written TypeScript definitions.

### Verified

- Weight factors recomputed term by term as `Wi = 3^(i-1) mod 31`.
- **2149 real Unified Social Credit Identifiers** taken from two PDFs published
  by Chinese government bodies (Ministry of Finance; Shanghai Municipal Tax
  Service) parsed with a 100% pass rate — the check that the constants,
  transcribed from a Wikisource copy of the standard rather than an official
  PDF, are correct. 55 of those codes ship as a test fixture.
