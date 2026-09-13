# Payload 3.89 upgrade candidate: security evidence

Base `dd20cac`, 13 September 2026. Read-only dependency review, no installation.

Fresh `npm audit --omit=dev --json` reports eight moderate affected package
entries, no high/critical, exit 1 (`11cdaa`). It now suggests 3.89.0. Registry
metadata confirms that version exists and @payloadcms/next's peer range includes
our Next 16.3.4 (`18c073`). This is not proof of an upstream security fix.

## Contradictory evidence resolved conservatively

- [GHSA-jg8r-5jh2-v2xj](https://github.com/advisories/GHSA-jg8r-5jh2-v2xj)
  still lists no patched version when read today.
- The unlock operation sources in tags 3.88.0 and 3.89.0 still consult the
  configured unlock policy. The
  [3.89 collection defaults](https://raw.githubusercontent.com/payloadcms/payload/v3.89.0/packages/payload/src/collections/config/defaults.ts)
  assign `defaultAccess` to unlock, and its
  [default access function](https://raw.githubusercontent.com/payloadcms/payload/v3.89.0/packages/payload/src/auth/defaultAccess.ts)
  still accepts a truthy authenticated user.
- Therefore npm's suggested upgrade does not establish remediation of this
  default-policy issue. My initial commentary calling it a corrected version
  was premature and was explicitly corrected before changing anything.

Keep `Users.access.unlock = ownerOnly` and the HTTP test that rejects anonymous
and foreign-authenticated identities while allowing the owner. Do not remove
the mitigation or declare security closure because a version falls outside the
current advisory range. This inspection is not a full upstream vulnerability
reproduction or an audit of all 3.89 code.

## Upgrade value and next gate

[3.89 release notes](https://github.com/payloadcms/payload/releases/tag/v3.89.0)
include relevant upload, version-diff and editor fixes, but also explicitly
identify a breaking jobs-access change. An isolated upgrade rehearsal remains
worthwhile: align all Payload packages, examine lockfile and peer changes,
retain auth regression gates, then unit/integration, physical recovery, build
and browser checks. Do not use audit fix --force, change the public app or
upgrade the active editor without that evidence.

The independent review of our unlock mitigation is still requested from Claude;
a read-only source comparison here is not that independent review. Infrastructure,
operator recovery and browser authorization remain separate gates.
