// Keep trust enabled without forwarding Node's worker-incompatible flag.
// Unknown/multiple options are deliberately left untouched, never parsed away.
export function buildEnvironment(env, platform = process.platform, version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number)
  const supportsSystemCAEnv = major >= 25 || (major === 24 && minor >= 6) || (major === 22 && minor >= 19)
  if (platform !== 'win32' || !supportsSystemCAEnv || env.NODE_OPTIONS?.trim() !== '--use-system-ca') return { ...env }
  return { ...env, NODE_OPTIONS: '', NODE_USE_SYSTEM_CA: '1' }
}
