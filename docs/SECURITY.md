# Security

## Reporting a vulnerability

If you discover a security vulnerability in Agent Config, please do not open a
public issue. Send details to the repository maintainer through GitHub's private
vulnerability reporting feature, or contact the maintainer directly.

## Supported versions

Only the latest release of Agent Config receives security updates.

## Configuration provenance

Curated entries carry pinned source provenance (`repo`, `path`, `commit`,
`commitDate`, `license`) so you can verify where each config originated.
Harvested entries appear with links and provenance only — they are never given
public failing grades.

## Supply chain

The `files` field of `package.json` limits published output to `dist/`,
`registry/index.json`, `schema/`, `docs/`, and `README.md`. Dev dependencies
and test fixtures are not published.
