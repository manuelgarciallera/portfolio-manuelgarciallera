import type { ReactNode } from 'react'
import styles from './PublicationBundleControls.module.css'

// Payload document controls already live inside the editor's form. Keep action
// inputs separate from that form's submission without nesting another form.
export const DocumentActionGroup = ({ children, disabled, label, onAction }: {
  children: ReactNode
  disabled: boolean
  label: string
  onAction: () => Promise<void>
}) => <fieldset className={styles.controls} disabled={disabled} aria-label={label} onKeyDown={(event) => {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return
  event.preventDefault()
  event.stopPropagation()
  if (!disabled) void onAction()
}}>{children}</fieldset>
