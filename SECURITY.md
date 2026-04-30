# Security Policy

## Supported Versions

Security fixes are prioritized for the latest major version in this repository.

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting a Vulnerability

Please report vulnerabilities privately. Do not open a public GitHub issue.

Preferred channels:
- Email: `janvisinghal10@gmail.com`
- GitHub Security Advisory: use the repository's "Report a vulnerability" flow

Include:
- Affected component (`backend`, `web`, `contracts`, `monitoring`)
- Steps to reproduce
- Impact assessment
- Suggested remediation (if known)

## Response Targets

- Initial acknowledgment: within 72 hours
- Triage decision: within 7 days
- Status updates: at least every 7 days until resolved

## Disclosure Policy

- We coordinate fixes before public disclosure.
- We may ask for a reasonable embargo window.
- Contributors who report valid vulnerabilities will be credited (if desired).

## Security Best Practices for Contributors

- Never commit secrets, private keys, or production tokens.
- Use `.env` and `.env.local` files for local credentials.
- Rotate test credentials if they are exposed.
- Validate all external inputs and sanitize logs.

Thank you for helping keep LumenShake and its users safe.
