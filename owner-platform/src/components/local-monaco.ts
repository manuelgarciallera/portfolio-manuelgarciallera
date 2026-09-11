import { dependencies } from '../../package.json'

type AMDLoader = {
  (modules: string[], ready: () => void, failed: () => void): void
  config: (config: { paths: { vs: string } }) => void
}
type EditorWindow = Window & { monaco?: { editor: unknown }; require?: AMDLoader }
let initialization: Promise<void> | undefined

// Payload currently needs Monaco's AMD/global API. Keep this bridge version-
// pinned and on-demand; an upstream move to ESM requires the browser gate.
export function initializeLocalMonaco(): Promise<void> {
  if (initialization) return initialization
  initialization = new Promise<void>((resolve, reject) => {
    // The browser AMD require is not Node's ambient CommonJS require type.
    const browser = window as unknown as EditorWindow
    if (browser.monaco?.editor) { resolve(); return }
    const base = `/vendor/monaco/${dependencies['monaco-editor']}/vs`
    const script = document.createElement('script')
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      script.onload = null
      script.onerror = null
      if (error) reject(error)
      else resolve()
    }
    const timer = setTimeout(() => finish(new Error('Local editor initialization timed out')), 20_000)
    script.src = `${base}/loader.js`
    script.onerror = () => finish(new Error('Local editor loader unavailable'))
    script.onload = () => {
      try {
        if (!browser.require?.config) throw new Error('Local editor loader invalid')
        browser.require.config({ paths: { vs: base } })
        browser.require(['vs/editor/editor.main'], () => {
          finish(browser.monaco?.editor ? undefined : new Error('Local editor unavailable'))
        }, () => finish(new Error('Local editor modules unavailable')))
      } catch {
        finish(new Error('Local editor initialization failed'))
      }
    }
    document.body.appendChild(script)
  })
  return initialization
}
