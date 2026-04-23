# 🛡️ Security Audit — Budgeting Ledger
_Answers based on source code analysis. Last reviewed: April 23, 2026._

---

## 🔐 1. Authentication & Identity

| Question | Answer |
|---|---|
| Do you have any user authentication at all? | **Yes — optional.** Google OAuth 2.0, only when sync is enabled. The app works fully offline without it. |
| Where is auth handled? | Client-side only via `expo-auth-session` / `expo-google-oauth`. No custom backend. |
| Are tokens stored only in Expo SecureStore? | **Yes.** All 5 sensitive values (access token, expiry, refresh token, email, display name) use `expo-secure-store` exclusively. |
| Do you ever store tokens in AsyncStorage or plain files? | **No.** Nothing auth-related is in SQLite or AsyncStorage. |
| Are refresh tokens used? | **Yes.** `access_type: 'offline'` and `prompt: 'consent'` ensure Google returns a refresh token. |
| Are refresh tokens stored securely? | **Yes.** Stored in SecureStore under `SECURE_KEYS.GOOGLE_REFRESH_TOKEN`. |
| Do tokens expire? | **Yes.** Access tokens expire. Expiry is stored and checked on every use; auto-refresh fires 60 s before expiry. |
| Do you handle token revocation? | **Yes.** Sign-out calls `https://oauth2.googleapis.com/revoke` server-side before clearing local keys. |
| Can a user log out and fully clear credentials? | **Yes.** Sign-out deletes all 5 SecureStore keys and resets the SQLite sync config. |
| Are there any hardcoded credentials? | **No.** The Android OAuth client ID was previously in `app.json`; it has since been moved to an environment variable (`GOOGLE_ANDROID_CLIENT_ID`) read in `app.config.js` and stored as an EAS Secret for CI/production builds. The client ID is a public identifier (not a secret), but keeping it out of source control is best practice. |

---

## 🔑 2. Google Sheets / OAuth Integration

| Question | Answer |
|---|---|
| Which OAuth scopes are requested? | `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.metadata.readonly`, plus `openid`, `email`, `profile`. |
| Are you using least-privilege scopes? | **Partially.** `drive.metadata.readonly` is minimal. `spreadsheets` grants read/write on _all_ sheets in the account — no file-specific scope exists in the Google API for this use case. |
| Do you store OAuth tokens locally or remotely? | **Locally only**, in SecureStore. |
| Are tokens ever logged? | **No.** Zero `console.log`/`warn` calls containing token values found across all source files. |
| Do you validate the OAuth response properly? | **Yes.** Token presence and expiry are checked before every API call in `getGoogleAccessToken()`. |
| Do you verify token integrity (ID token validation)? | **Not applicable.** No ID token is requested or used; the app only uses access/refresh tokens for API calls. |
| Is PKCE used? | **Yes.** `usePKCE: true` is explicitly set in `Google.useAuthRequest`. |
| Can tokens be reused across devices? | **No.** Tokens are device-local in SecureStore; no cross-device sharing mechanism exists. |
| Do you handle token expiration gracefully? | **Yes.** Expiry is checked before each sync; the refresh flow runs automatically. |
| What happens if a token is stolen? | Attacker gains read/write access to all user Google Sheets until the refresh token is revoked. Sign-out triggers server-side revocation. No additional in-app mitigation (e.g., device binding). |

---

## 📱 3. Local Data Storage (SQLite)

| Question | Answer |
|---|---|
| Is your SQLite database encrypted? | **Yes.** `expo-sqlite` is built with SQLCipher (`useSQLCipher: true` in the plugin config). `initDbConnection()` generates a 256-bit random key via `crypto.getRandomValues`, stores it in SecureStore under `db_encryption_key`, and applies it with `PRAGMA key = "x'<hex>'";` on every open. |
| Have you evaluated the risk? | **Yes — mitigated.** Financial data at rest is encrypted. Requires a native rebuild (`expo prebuild` + `npx expo run:android`) to take effect. |
| Where is the DB file stored? | Default app sandbox path — `budgeting.db` opened via `SQLite.openDatabaseSync('budgeting.db')`. |
| Does the app ever export raw DB files? | **No.** |
| Are backups possible (iCloud / Android backup)? | **Mitigated.** A `withBackupRules` Expo config plugin writes `secure_store_backup_rules.xml` (Android 6–11) and `secure_store_data_extraction_rules.xml` (Android 12+) during `expo prebuild`. Both files exclude `sharedpref/.` (SecureStore keys) and `database/budgeting.db`. The DB is also encrypted at rest as an additional layer. |
| Is sensitive data stored in plain text? | **No** — transaction amounts, notes, and dates are stored in an encrypted SQLite database (SQLCipher, 256-bit key). OAuth credentials remain in SecureStore. |
| Do you store any secrets in SQLite? | **No.** SecureStore is used exclusively for all OAuth credentials. |
| Can another app access your DB file? | **No** on a non-rooted device. Accessible on rooted/jailbroken devices. |
| Do you clear data on logout? | Sync config row is cleared on sign-out. Transaction/budget data is not cleared (it is local financial data, not PII tied to the account). |
| Do you support multiple users on one device? | **No.** Single-user design. |

---

## 🔒 4. Device & Runtime Security

| Question | Answer |
|---|---|
| Do you detect rooted/jailbroken devices? | **No.** |
| Do you restrict functionality on compromised devices? | **No.** |
| Do you use any app-level lock (PIN/biometric)? | **No.** |
| Is sensitive data visible in app switcher screenshots? | **Potentially yes** — no screen-obscuring mechanism on app background. |
| Do you prevent screen recording/screenshots? | **No.** |
| Do you use `FLAG_SECURE` on Android? | **No.** |
| Is debugging disabled in production builds? | **Yes** — standard Expo/React Native production builds disable debug mode. No custom override found. |
| Are logs stripped in production? | **Yes.** Metro strips `console.log` in production bundles. The web-platform DB mock uses silent no-op functions — no `console.warn` or SQL bind parameter logging on any platform. |
| Do you use HTTPS for all network calls? | **Yes.** All API calls target `googleapis.com` over HTTPS. No `http://` URLs found. |
| Do you validate SSL certificates? | **Yes** — implicitly, via the platform's default TLS stack. No custom bypass added. |

---

## 🌐 5. Network & API Security

| Question | Answer |
|---|---|
| Does your app communicate with any backend? | **Yes** — Google Sheets API and Google Drive API only. No custom backend. |
| Is authentication required for all endpoints? | **Yes.** Every request goes through `authorizedFetch`, which attaches a `Bearer` token. |
| Are API requests signed or validated? | Authenticated via OAuth Bearer token on every call. |
| Do you use HTTPS exclusively? | **Yes.** |
| Do you handle certificate pinning? | **Partially mitigated.** Full host-specific certificate pinning is not implemented. However, a `withNetworkSecurityConfig` Expo config plugin writes `network_security_config.xml` during `expo prebuild`, which: (1) blocks all cleartext (HTTP) traffic at the OS level, and (2) restricts TLS trust to the Android system CA bundle — user-installed CAs (proxy tools, rogue MDM certificates) cannot intercept HTTPS calls. |
| Are network errors handled securely? | **Yes.** Errors are caught; `parseErrorMessage` extracts a safe message without leaking raw response bodies to the UI. |
| Do you log request/response bodies? | **No.** No logging of API payloads found. |
| Could sensitive data leak via logs? | Low risk on production. The web DB mock previously logged SQL bind params via `console.warn`; this has been fixed — all web mock functions are now silent no-ops. |
| Do you retry failed requests safely? | **No automatic retry** — failed syncs surface an error to the user. |
| Are there rate limits? | Not implemented in-app. Relies on Google API's own rate limiting. |

---

## 🧾 6. Input Validation & Injection Risks

| Question | Answer |
|---|---|
| Do you validate all user inputs? | **Yes** for transactions. `validateTransaction` enforces: positive finite amount, `income`/`expense` type, valid ISO date, existing `categoryId`. |
| Are transaction notes sanitized? | **Yes — for Google Sheets writes.** `sanitizeForSheets()` prefixes any string starting with `=`, `+`, `-`, `@`, tab, or CR with a single quote before writing to the sheet. Applied to all string positions in `rowToValues` and `deletedRowValues`. |
| Can users input arbitrary text in notes? | **Yes.** |
| Do you escape data before rendering? | React Native renders text as plain text — no raw HTML rendering, XSS is not applicable. |
| Do you use any WebViews? | **No** custom WebViews found. |
| Can user input reach Google Sheets? | **Yes** — transaction name/note and category name are written to the sheet. |
| Do you sanitize spreadsheet exports? | **Yes** — `sanitizeForSheets()` is applied to all string fields written to the sheet. |
| Do you prevent formula injection (`=`, `+`, `-`, `@`)? | **Yes — fixed.** `sanitizeForSheets()` in `syncService.ts` prefixes dangerous leading characters with a single quote, neutralising formula execution in Google Sheets regardless of `valueInputOption`. Applied to every string column including name, category, sync key, owner key, amount, datetime, and updatedAt. |
| Are numeric inputs strictly validated? | **Yes.** Amount must be a positive finite number; non-numeric input is rejected. |

---

## 📦 7. Dependencies & Supply Chain

| Question | Answer |
|---|---|
| Are you using GitHub Dependabot? | **Not configured.** No `dependabot.yml` found. |
| Do you regularly update dependencies? | Cannot be determined from code alone. |
| Do you audit new packages before installing? | Cannot be determined from code alone. |
| Are any packages abandoned/unmaintained? | No obviously abandoned packages. All key deps (`expo`, `expo-sqlite`, `expo-secure-store`, `expo-auth-session`) are actively maintained. |
| Do you lock dependency versions? | **Yes** — `package.json` pins versions; a lockfile is generated on install. |
| Expo managed or bare workflow? | **Bare workflow** — `android/` directory is present. |
| Do you trust all native modules? | All native modules are first-party Expo packages or React Native community standards. |
| Have you checked for known CVEs? | No evidence of a formal CVE review in the repo. |
| Do you run `npm audit`? | No CI step found for this. |
| Are build dependencies reviewed? | No evidence of a formal review. |

---

## 🧠 8. Business Logic Integrity

| Question | Answer |
|---|---|
| Can transactions be duplicated accidentally? | Local SQLite has no unique constraint preventing duplicate entries. During sync, the `ownerKey::localId` composite key prevents remote duplicates. |
| Can data be corrupted during sync? | **Possible** — see section 9 on non-atomic sync. |
| What happens if sync fails mid-process? | Error is caught and surfaced to the user. Local data is authoritative — the app can re-sync. The remote sheet may be partially cleared if failure occurs during full sync. |
| Is there conflict resolution logic? | **Yes, basic.** Deletions are tracked in a separate table; `updatedAt` timestamps determine direction. |
| Can users overwrite existing data unintentionally? | Full sync replaces all remote data with local data. Manual edits in the sheet are overwritten on next full sync. |
| Are calculations validated? | Budget and total calculations are derived live from SQLite queries — no cached totals that could drift. |
| Could rounding errors affect balances? | Amounts are stored as `REAL` in SQLite. Minor floating-point drift is possible for values with many decimal places. |
| Is there data validation before saving? | **Yes** — `validateTransaction` runs before any insert/update. |
| Can invalid states exist in the DB? | `PRAGMA foreign_keys = ON` is set. Schema uses `NOT NULL` where appropriate. |
| Do you handle edge cases (negative values, overflow)? | Negative amounts are rejected by validation. Very large numbers are not explicitly capped but are bounded by SQLite `REAL` limits. |

---

## 🔄 9. Sync & Data Consistency (Google Sheets)

| Question | Answer |
|---|---|
| Is sync atomic (all-or-nothing)? | ⚠️ **No.** Full sync performs a `:clear` then a separate write. A crash between them leaves the sheet empty. |
| Can partial syncs occur? | **Yes** — network failure mid-write can leave the sheet in a partial state. |
| Do you detect duplicate uploads? | **Yes** — each row carries a `ownerKey::localId` key; incremental sync only writes rows not already present. |
| Is there versioning or timestamps? | **Yes** — `GOOGLE_SYNC_SCHEMA_VERSION` guards schema migrations; rows use `updatedAt` timestamps. |
| Can data be overwritten from Sheets? | **Yes** — pull sync imports sheet data into SQLite and can update local rows. |
| Do you validate incoming data from Sheets? | **Partially.** `parseRowToSyncRow` maps columns but does not deeply validate all field types. |
| Is there conflict resolution? | **Yes** — last-write-wins based on `updatedAt`; deletions are tracked separately. |
| Are sync operations authenticated every time? | **Yes** — every sync call goes through `getGoogleAccessToken()`, which checks expiry and refreshes. |
| Do you log sync errors? | **Yes** — errors are stored in SQLite (`GOOGLE_SYNC_LAST_ERROR`) and shown in the UI. |
| Can a malicious sheet modify app data? | **Partially.** A maliciously crafted sheet could inject unexpected values during a pull sync. Inbound validation is not strict enough to fully prevent this. |

---

## 🧪 10. Testing & Tooling

| Question | Answer |
|---|---|
| Is GitHub CodeQL enabled? | **Not found.** No `.github/workflows` directory in the workspace. |
| Do you run static analysis locally? | No evidence of Semgrep, ESLint security plugins, or equivalent in `eslint.config.js` or `package.json`. |
| Do you test for edge cases manually? | Cannot be determined from code. |
| Have you tried to break your own app? | Cannot be determined from code. |
| Do you simulate bad input deliberately? | No automated tests found. |
| Do you test on real devices? | Cannot be determined from code. |
| Have you tested offline scenarios? | Cannot be determined from code. |
| Do you test failed sync conditions? | Cannot be determined from code. |
| Have you reviewed logs for sensitive data? | **Partially** — no token values are logged. The web DB mock logs SQL bind params (low-risk, dev/web only). |
| Have you done a manual security review before? | **This document is the first recorded review.** |

---

## 🚨 Issues Requiring Action

| Priority | Issue | Location |
|---|---|---|
| ~~**HIGH**~~ ✅ FIXED | Formula injection — `sanitizeForSheets()` added; prefixes `=`,`+`,`-`,`@`,tab,CR with `'`; applied to all string positions in `rowToValues` and `deletedRowValues` | `services/syncService.ts` |
| ~~**MEDIUM**~~ ✅ FIXED | SQLite encryption — `initDbConnection()` generates a 256-bit key via `crypto.getRandomValues`, stores it in SecureStore, and applies `PRAGMA key`; `useSQLCipher: true` in plugin config | `database/connection.ts`, `app.json` |
| **MEDIUM** | Full sync is non-atomic — clear then write can destroy remote data on crash | `services/syncService.ts` — `performFullSync` |
| ~~**LOW**~~ ✅ FIXED | Sync owner key now uses `crypto.randomUUID()` (CSPRNG) | `services/settingsService.ts` |
| ~~**LOW**~~ ✅ FIXED | Web DB mock no longer logs SQL bind parameters — all mock functions are silent no-ops | `database/connection.ts` |
| ~~**LOW**~~ ✅ FIXED | Android OAuth client ID moved out of `app.json` into `app.config.js` env var (`GOOGLE_ANDROID_CLIENT_ID`) + EAS Secret for production builds | `app.config.js`, `app.json` |
| ~~**INFO**~~ ✅ MITIGATED | No true certificate pinning, but `network_security_config.xml` (generated by `withNetworkSecurityConfig` plugin) blocks HTTP and restricts TLS trust to system CAs — user-installed proxy/MDM CAs cannot intercept | `app.config.js`, `config/android/network_security_config.xml` |
| ~~**INFO**~~ ✅ MITIGATED | OS backup exclusions added via `withBackupRules` plugin — `secure_store_backup_rules.xml` (Android 6–11) and `secure_store_data_extraction_rules.xml` (Android 12+) exclude SecureStore keys and `budgeting.db`; DB is also encrypted at rest | `app.config.js`, `config/android/` |
