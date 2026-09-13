# Original Payload rich-text fixtures

Unmodified files from the installed, lockfile-pinned
`@payloadcms/richtext-lexical@3.89.0` package:

- `Field.original.txt`: `dist/field/Field.js`
- `Field.browser.original.txt`: `dist/exports/client/Field-J6MIUIWP.js`

The test asserts their original SHA256 before executing the relevant handlers.
These are non-runtime regression fixtures so tests still exercise the original
failure after postinstall patches node_modules. Do not refresh them silently
when upgrading Payload. Copyright and MIT license accompany the fixtures;
LICENSE.md is copied from the same-version Payload package in the same upstream
repository, https://github.com/payloadcms/payload.
