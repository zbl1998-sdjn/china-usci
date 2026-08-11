# Releasing

Publishing runs on npm **trusted publishing** (OIDC). There is no npm token in
this repository, in its secrets, or on any maintainer's machine. npm verifies
that a publish request came from this repository, from
`.github/workflows/publish.yml`, running on GitHub's infrastructure — a
credential that cannot be stolen because it does not persist between runs.

## Cutting a release

1. Bump `version` in `package.json`.
2. Add the entry to `CHANGELOG.md`.
3. Commit both.
4. Tag and push:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

The `Publish to npm` workflow does the rest, and npm attaches a provenance
attestation automatically.

## One-time setup on npmjs.com

Configured once per package, under the package's **Settings → Trusted Publisher**:

| Field | Value |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `zbl1998-sdjn` |
| Repository | `china-usci` |
| Workflow filename | `publish.yml` — filename only, not a path |
| Environment | *(left empty)* |
| Allowed actions | `npm publish` |

If the workflow file is ever renamed, this must be updated to match, or publishes
will be rejected.

## Requirements this depends on

- `permissions: id-token: write` in the workflow — without it npm cannot verify
  the caller.
- npm >= 11.5.1 and Node >= 22.14. The workflow pins Node 24, which ships npm 11.17+.
- No `npm ci` step: this package has zero dependencies and therefore no lockfile,
  and `npm ci` requires one. Do not "fix" its absence.

## Verifying it worked

```bash
npm view china-usci dist-tags.latest
npm view china-usci --json
```

A trusted publish carries a provenance attestation; a token publish does not.
That difference shows on the package page as a "Built and signed on GitHub Actions"
badge, and is the quickest way to confirm the OIDC path was actually used.
