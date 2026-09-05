'use client'

import { useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'

import { buildMediaPlacementPreview, presentPreviewAsset, type PlacementBreakpoint, type PreviewAsset } from '@/media/placement-preview'
import { MEDIA_FITS, MEDIA_FRAMES } from '@/media/placement'
import styles from './MediaPlacementEditor.module.css'

const breakpointLabels: Record<PlacementBreakpoint, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' }

export const MediaPlacementEditor = () => {
  const controlId = useId()
  const { setModified } = useForm()
  const [formFields, dispatchFields] = useFormFields((context) => context)
  const [breakpoint, setBreakpoint] = useState<PlacementBreakpoint>('desktop')
  const [asset, setAsset] = useState<PreviewAsset | null>(null)
  const [assetErrorId, setAssetErrorId] = useState<string | null>(null)
  const preview = useMemo(() => buildMediaPlacementPreview(formFields as Record<string, unknown>, breakpoint), [breakpoint, formFields])

  useEffect(() => {
    if (!preview) return
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`/api/media/${encodeURIComponent(String(preview.assetId))}?depth=0`, { credentials: 'same-origin', signal: controller.signal })
        if (!response.ok) throw new Error('Media unavailable')
        setAsset(presentPreviewAsset(await response.json(), preview.assetId))
        setAssetErrorId(null)
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setAssetErrorId(String(preview.assetId))
      }
    }
    void load()
    return () => controller.abort()
  }, [preview?.assetId]) // eslint-disable-line react-hooks/exhaustive-deps -- only refetch when the selected original changes

  const path = (name: string) => breakpoint === 'desktop' ? `placement.${name}` : `placement.overrides.${breakpoint}.${name}`
  const update = (name: string, value: string | number) => {
    dispatchFields({ path: path(name), type: 'UPDATE', value })
    setModified(true)
  }
  const currentAsset = asset && preview && String(asset.id) === String(preview.assetId) ? asset : null
  const assetError = Boolean(preview && assetErrorId === String(preview.assetId))
  const ratio = preview?.aspectRatio === 'auto' && currentAsset?.width && currentAsset.height ? `${currentAsset.width} / ${currentAsset.height}` : preview?.aspectRatio ?? '16 / 9'
  const imageStyle = preview ? {
    objectFit: preview.fit,
    objectPosition: `${preview.focalX}% ${preview.focalY}%`,
    transform: `scale(${preview.zoom})`,
    transformOrigin: `${preview.focalX}% ${preview.focalY}%`,
  } as CSSProperties : undefined

  return (
    <section className={styles.editor} aria-labelledby="media-placement-editor-title">
      <div className={styles.heading}>
        <div><h3 id="media-placement-editor-title">Encuadre reversible</h3><p>El original se conserva. Estos controles solo cambian su colocación.</p></div>
        <div className={styles.breakpoints} aria-label="Viewport de previsualización">
          {(Object.keys(breakpointLabels) as PlacementBreakpoint[]).map((value) => (
            <button aria-pressed={breakpoint === value} key={value} onClick={() => setBreakpoint(value)} type="button">{breakpointLabels[value]}</button>
          ))}
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.stage} style={{ aspectRatio: ratio }}>
          {currentAsset && preview ? (
            // The authenticated local media URL is dynamic owner data; an ordinary image preserves the exact crop without adding public optimization work.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={currentAsset.alt || 'Previsualización del medio seleccionado'} src={currentAsset.url} style={imageStyle} />
          ) : <p>{assetError ? 'No se pudo cargar el medio seleccionado.' : 'Selecciona un medio y completa los valores para previsualizarlo.'}</p>}
          {currentAsset && preview && <span className={styles.focus} style={{ left: `${preview.focalX}%`, top: `${preview.focalY}%` }} aria-hidden="true" />}
        </div>
        <div className={styles.controls}>
          <label htmlFor={`${controlId}-x`}>Punto focal horizontal <output htmlFor={`${controlId}-x`}>{Math.round(preview?.focalX ?? 50)}%</output><input id={`${controlId}-x`} min="0" max="100" step="1" type="range" value={preview?.focalX ?? 50} onChange={(event) => update('focalX', Number(event.target.value) / 100)} /></label>
          <label htmlFor={`${controlId}-y`}>Punto focal vertical <output htmlFor={`${controlId}-y`}>{Math.round(preview?.focalY ?? 50)}%</output><input id={`${controlId}-y`} min="0" max="100" step="1" type="range" value={preview?.focalY ?? 50} onChange={(event) => update('focalY', Number(event.target.value) / 100)} /></label>
          <label htmlFor={`${controlId}-zoom`}>Zoom <output htmlFor={`${controlId}-zoom`}>{(preview?.zoom ?? 1).toFixed(2)}×</output><input id={`${controlId}-zoom`} min="1" max="4" step="0.05" type="range" value={preview?.zoom ?? 1} onChange={(event) => update('zoom', Number(event.target.value))} /></label>
          <label>Ajuste<select value={preview?.fit ?? 'cover'} onChange={(event) => update('fit', event.target.value)}>{MEDIA_FITS.map((value) => <option key={value} value={value}>{value === 'cover' ? 'Cubrir' : 'Contener'}</option>)}</select></label>
          <label>Proporción<select value={preview?.frame ?? 'auto'} onChange={(event) => update('frame', event.target.value)}>{MEDIA_FRAMES.map((value) => <option key={value} value={value}>{value === 'auto' ? 'Original' : value}</option>)}</select></label>
        </div>
      </div>
    </section>
  )
}
