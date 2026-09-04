'use client'

import { RefObject, useEffect, useRef, useState } from 'react'

export function useViewportActivity<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: '12% 0px', threshold: 0.04 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, isActive]
}
