# china-usci

[![npm](https://img.shields.io/npm/v/china-usci)](https://www.npmjs.com/package/china-usci)[![CI](https://github.com/zbl1998-sdjn/china-usci/actions/workflows/ci.yml/badge.svg)](https://github.com/zbl1998-sdjn/china-usci/actions/workflows/ci.yml)[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/china-usci?activeTab=dependencies)[![license](https://img.shields.io/npm/l/china-usci)](LICENSE)

Parse and verify the 18-character **Unified Social Credit Identifier** (统一社会信用代码) printed on every mainland Chinese business licence.

Offline. Zero dependencies. And explicit about what a passing code *does not* prove.

```bash
npm install china-usci
```

```js
import { parseUsci } from 'china-usci';

const result = parseUsci('91110302 60002492 XA');   // spacing and case are tolerated

result.status;         // 'ok'
result.segments;       // the five parts, each decoded
result.proves;         // ['The 18 characters are internally consistent, …']
result.doesNotProve;   // five things it does not establish — do not drop these
```

Or without writing any code:

```console
$ npx china-usci 9111030260002492XA
✓ 9111030260002492XA  transcribed correctly
  1-1    9          Registration authority code — Market regulation (工商)
  2-2    1          Entity category code — Enterprise (企业)
  3-8    110302     Administrative division code — Registered in Beijing.
  9-17   60002492X  Subject identifier (organization code)
  18-18  A          Check character

  A passing code does not show:
    · That the company exists. A correctly formed code can be invented.
    · That the company is still active rather than revoked or deregistered.
    · That its registered business scope covers what you are buying.
    · That it may legally export to you. …
    · That the company on this code is the same one issuing your invoice …
```

---

## The one thing to understand before using this

**A passing code means the code was transcribed correctly. That is all it means.**

It does not mean the company exists. A well-formed code can be invented in a minute — the check character is arithmetic, not a registry lookup. Nothing here touches any database.

This is why every result carries `doesNotProve`, and why the library never uses the word "valid". "Valid" gets read as "this company is fine", and that reading has cost people money. If you surface a result in your own UI, carry those five statements with it.

To find out whether a company actually exists and is still trading, you have to read the registry — a separate step this package deliberately does not pretend to do.

## How much protection the check character actually gives

Not a claim, a measurement. We generated single-character transcription errors
and counted how many the check character catches:

| Identifier | Errors generated | Caught |
|---|---|---|
| **USCI** (this package) | 1,080,000 | **100%** |
| VIN (vehicle identification number) | 1,088,000 | 92.52% |

Measured 9 August 2026, fixed seed 20260809, reproducible.
Catching every single-character slip is a real guarantee, and it is also the
*only* guarantee: it says nothing about whether the company behind the code exists.
A passing code still has to match the document you were sent.

Method, raw data and the generator script are published under CC BY:
[DOI 10.5281/zenodo.21867383](https://doi.org/10.5281/zenodo.21867383).

Related open datasets on Chinese company records, each dated and citable:
[currawongweb.com/research](https://currawongweb.com/research/).

## What it decodes

GB 32100-2015 fixes both the length and the layout:

| Positions | Part | What you learn |
|---|---|---|
| 1 | Registration authority | Which body registered it — market regulation, civil affairs, judicial administration… |
| 2 | Entity category | **`9`+`1` = enterprise, `9`+`2` = individually-owned business** (个体工商户), `9`+`3` = farmers' cooperative |
| 3–8 | Administrative division (GB/T 2260) | Province of registration |
| 9–17 | Subject identifier | The organization code |
| 18 | Check character | Recomputed here, not read back |

Two of these are worth calling out.

**Position 2 catches a mistake buyers make constantly.** An individually-owned business is run by a natural person, with a different liability profile and usually a different scale from a company. A photo of the licence will not make that obvious. The second character will. `categoryFor()` returns `isIndividualBusiness` as its own flag for exactly this reason.

**Positions 3–8 resolve to province only, on purpose.** Prefecture and county codes change as divisions are redrawn — counties become districts, areas merge, places get renamed — so an embedded table of them goes stale and starts returning wrong answers. Handing someone an out-of-date city name is worse than handing them nothing, because they will check it against the address on the licence. Province codes have been stable for decades.

A prefix belonging to Taiwan (71), Hong Kong (81) or Macau (82) is flagged as `mainland: false`. SAMR does not register those, so such a prefix should not appear on a mainland licence at all.

## Where the constants come from, and how they were checked

The algorithm is **GB 32100-2015**《法人和其他组织统一社会信用代码编码规则》, in force since 2015-10-01.

The weight factors and character set were transcribed from the standard's full text **on Wikisource, not from an official PDF**. That is a real transcription risk, so it was checked two independent ways:

**1. Arithmetic.** Every weight is recomputed as `Wi = 3^(i-1) mod 31` and compared term by term in the test suite.

**2. Real codes issued by Chinese authorities.** On 2026-08-11, **2149 Unified Social Credit Identifiers** were lifted from two PDFs published by Chinese government bodies — an annex from the Ministry of Finance, and a 62-page announcement from the Shanghai Municipal Tax Service — and parsed. **All 2149 passed.**

That second check is the one that matters. The check character is drawn from a 31-character set, so a single wrong weight or character would push the pass rate on real codes toward 1 in 31. A 2149/2149 result is not consistent with a transcription error.

Note what this does *not* rest on: a generated corpus. Codes produced by the same weight table you are trying to verify will always agree with it, whether or not the table is right. Self-consistency proves nothing about transcription — only independently issued codes do.

55 of those codes ship in `test/fixtures/official-codes.json` with their source URL, so `npm test` re-runs a slice of that check on your machine. Only the codes were extracted; no company names were taken or stored.

## API

```js
import {
  parseUsci, isWellFormed, normalise, checkCharacterFor,
  authorityFor, categoryFor, provinceFor,
  USCI_CHARSET, USCI_WEIGHTS, USCI_DOES_NOT_PROVE
} from 'china-usci';
```

### `parseUsci(input) → result`

`result.status` is one of:

| status | meaning |
|---|---|
| `ok` | 18 permitted characters, check character matches |
| `check-failed` | well formed, but the check character is wrong — reports `expectedCheckCharacter` and `actualCheckCharacter` |
| `bad-characters` | contains characters outside the set; names them, and says so explicitly when they are the excluded `I O Z S V` |
| `bad-length` | not 18 characters after normalisation |
| `empty` | nothing to parse |

`ok` and `check-failed` both carry `segments` and `doesNotProve`.

### `isWellFormed(input) → boolean`

Convenience predicate. Prefer `parseUsci` — this drops the reasons, and the reasons are the point.

### Everything else

`normalise` strips whitespace, full-width spaces and hyphens, then upper-cases — codes get copied off PDFs and photos, so messy input is normal input. `checkCharacterFor(first17)` exposes the arithmetic on its own. `authorityFor`, `categoryFor` and `provinceFor` are the table lookups, and each returns `null` rather than guessing when a value is not defined in the standard.

TypeScript definitions ship with the package.

## CLI

After `npm install -g china-usci` the command is `usci`; without installing, use `npx china-usci`.

```console
usci <code>              parse one code
usci --json <code>       same, as JSON
usci < codes.txt         one code per line, tab-separated results
usci --json < codes.txt  the same as a JSON array
```

Exit code is `0` only when every code parsed is `ok`, so it composes in shell pipelines:

```bash
cut -d, -f3 suppliers.csv | usci | grep -v '\bok\b'    # list the codes that fail
```

Colour is used only when writing to a terminal, and `NO_COLOR` is honoured.

## Design notes

**No network, ever.** Pure functions, no I/O. A code passed to this package does not leave the machine it is running on. That is a deliberate property, not an accident of scope — the people who most need to check a code are often the ones who most need not to announce that they are checking it.

**Ships unbuilt.** What you install is the source that runs. Four small files, split so each can be audited on its own: `tables.js` (transcribed data, no logic), `lookup.js` (table reads), `parse.js` (the algorithm), `index.js` (exports). Given that the constants came from a secondary source, being readable matters more than being minified.

**Zero dependencies**, and no plans for any.

## Contributing

Corrections to the tables are the most valuable thing you can send, especially with a citation to the standard or to an official source. If you re-run the real-code verification on a different sample and get a different result, please open an issue — that is exactly the kind of finding that should be public.

## Licence

MIT. See [LICENSE](LICENSE).

## Related

The same algorithm runs as a browser page at [currawongweb.com/verify/china-usci-checker](https://currawongweb.com/verify/china-usci-checker/), alongside a short study of how much protection the check digit actually gives ([DOI: 10.5281/zenodo.21867383](https://doi.org/10.5281/zenodo.21867383), CC BY).

Neither the page nor this package performs a registry lookup. Both stop at the same honest boundary: the code is transcribed correctly, and that is a different question from whether the company is real.
