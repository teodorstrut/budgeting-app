# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please do **not** open a public GitHub issue. Instead, report it privately by opening a [GitHub Security Advisory](../../security/advisories/new) or by emailing the maintainer directly (contact details on the GitHub profile).

Please include:
- A description of the vulnerability
- Steps to reproduce it
- Any potential impact you've identified

You can expect an acknowledgment within a few days and a resolution or mitigation plan as soon as possible.

## Scope

This is a personal finance tracking app. The following areas are considered in-scope for security reports:

- **Local data exposure** — vulnerabilities that could allow unauthorized access to locally stored financial data (SQLite database)
- **Google OAuth / token handling** — issues with how OAuth tokens or refresh tokens are stored or transmitted
- **Google Sheets sync** — unintended data leakage or unauthorized access via the sync integration
- **Dependency vulnerabilities** — known CVEs in direct dependencies that have a realistic impact on users

The following are **out of scope**:
- Theoretical attacks requiring physical access to an unlocked, rooted device
- Issues in Expo, React Native, or third-party libraries that are not yet patched upstream
- Missing security headers (this is a mobile app, not a web server)

## Security Considerations

- All data is stored locally on-device using SQLite via `expo-sqlite`. No data is sent to any server unless you explicitly enable Google Sheets sync.
- Google OAuth tokens are stored using `expo-secure-store`, which uses the platform's secure storage (Android Keystore / iOS Keychain).
- No analytics, tracking, or telemetry of any kind is collected.

## Supported Versions

This project is in active development. Security fixes will be applied to the latest version only.
