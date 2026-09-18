import './brand-signature.css'

/** Geometric M / G / LL / A reconstructed from Manuel's Framer references. */
export function BrandSignature() {
  return <span className="rd-brand-signature" aria-hidden="true">
    <span className="rd-brand-m">
      <svg viewBox="0 0 64 64" focusable="false"><path fill="currentColor" d="M4 4L32 32L4 60Z" /></svg>
      <span className="rd-brand-m-color" />
    </span>
    <span className="rd-brand-letters">
      <svg className="rd-brand-letter" viewBox="0 0 64 64" focusable="false"><path fill="currentColor" d="M4 4H60L38 26H26V38H38L32 32H60V60H4Z" /></svg>
      <svg className="rd-brand-letter" viewBox="0 0 64 64" focusable="false"><path fill="currentColor" d="M4 60L42 4V34L60 4V60Z" /></svg>
      <svg className="rd-brand-letter" viewBox="0 0 64 64" focusable="false"><path fill="currentColor" d="M4 4V60H60Z" /></svg>
    </span>
  </span>
}
