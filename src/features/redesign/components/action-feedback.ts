import type { HTMLAttributes } from 'react'

// Native gestures remain untouched. Explicit pointer feedback also works while
// touch browsers are deciding whether a contact is a tap or a scroll.
const clear = (event: { currentTarget: HTMLElement }) => {
  delete event.currentTarget.dataset.pressed
}
export const actionFeedback: HTMLAttributes<HTMLElement> = {
  onPointerDown: (event) => {
    if (event.isPrimary && event.button === 0) event.currentTarget.dataset.pressed = 'true'
  },
  onPointerUp: clear,
  onPointerCancel: clear,
  onPointerLeave: clear,
  onLostPointerCapture: clear,
  onBlur: clear,
  onContextMenu: clear,
}
