# Ascend 2.8 release checklist

## Preservation policy

- Keep Ascend 2.7.1 installed until the complete backup has been restored and verified in 2.8.
- 2.7.1 is `com.ascend.electric`; 2.8 is **`com.ascend.mobile`**. Both show as Ascend but can coexist.
- This package change is necessary because old ephemeral CI debug certificates cannot be used to authorize an in-place update. Android does **not** transfer private local files between package IDs.
- In 2.7.1 go to Settings → **Share my data backup**. Save the exported JSON in private storage; it contains your journal entries in **plain text** but excludes the PIN. Do not post it publicly or send it to anyone you do not trust.
- In 2.8 go to Settings → **Restore from exported backup**. Paste the JSON, verify and confirm. Then check running history, goals and the Journal. If there is no PIN in 2.8, create a new one.
- Old appearance color choices cannot be read automatically across Android package IDs from a 2.7.1 installation. Re-select the preferred color once. Future 2.8 backups include appearance.
- Do not uninstall 2.7.1 until entries have been checked in 2.8.
- Cloud backups still exclude private journal entries and PIN, but can include appearance and non-private focus sessions.

## Configure a permanent Android signing identity

The 2.8 release workflow **fails closed** if signing secrets are absent. It must never publish another randomly signed APK.

Generate a **new, permanent** keystore on a trusted computer (the example below asks for a secure password; protect the .jks file):

```bash
keytool -genkeypair -v -keystore ascend-release.jks -alias ascend-release -keyalg RSA -keysize 3072 -validity 10000
```

Make a secure, offline copy of `ascend-release.jks` and save its passwords.

In the GitHub repository go to **Settings → Secrets and variables → Actions → New repository secret**. Add the following four secrets:

- `ASCEND_KEYSTORE_BASE64` — base64 encoding of the .jks binary file (one line; `base64 -w 0 ascend-release.jks` on Linux; `base64 < ascend-release.jks | tr -d '\\n'` on macOS).
- `ASCEND_KEYSTORE_PASSWORD` — the keystore password.
- `ASCEND_KEY_ALIAS` — `ascend-release` (or the alias actually used).
- `ASCEND_KEY_PASSWORD` — the private key password.

**Never commit or share the keystore or passwords in the public repository.** The same keystore is essential for updates to 2.8 and later.

After secrets are configured, review development QA success and merge `ascend-2.8-dev` into main. The release job will validate the signing certificate, ZIP integrity and APK alignment before publishing. Back up the key yourself; GitHub secrets alone do not provide a recoverable copy.

## Before public release

- Automated XP tests pass; JS bundling passes; native Android widget compiles.
- Test complete JSON backup import from 2.7.1 on a real Samsung phone.
- Create a journal entry, force close, reopen, and verify it remains accessible through the PIN.
- Verify that changing or resetting Appearance never changes journal storage.
- Test each lightning preset, the XP rewards, Focus pause/resume/background/complete, and widget refresh.
- Confirm the release certificate fingerprint persists across two successive GitHub Actions releases.
- Do not claim old installation data is automatically restored, and do not remove 2.7.1 until verified.

## Compatibility and limitations

- Old user data lives in `ascend-v1`; appearance in `ascend-appearance-v1`. These keys remain unchanged within the same installation.
- XP is computed from deduplicated saved activity records rather than accumulating mutable counters.
- Focus sessions are stored separately in `ascend-2.8-focus`. Journal contents are **never** displayed by the home widget.
- Android widgets require an installed native build. The JavaScript bundle alone cannot install widgets.
