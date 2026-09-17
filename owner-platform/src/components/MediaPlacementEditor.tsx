'use client'

import { useForm, useFormFields, useFormInitializing, useFormProcessing } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'
import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'

import { buildMediaPlacementPreview, presentPreviewAsset, type PlacementBreakpoint, type PreviewAsset } from '@/media/placement-preview'
import { MEDIA_FITS, MEDIA_FRAMES } from '@/media/placement'
import styles from './MediaPlacementEditor.module.css'

const breakpointLabels: Record<PlacementBreakpoint, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' }

export const MediaPlacementEditor = ({ readOnly = false }: Pick<UIFieldClientProps, 'readOnly'>) => {
  const controlId = useId()
  const { setModified } = useForm()
  const processing = useFormProcessing()
  const initializing = useFormInitializing()
  const disabled = readOnly || processing || initializing
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
        setAsset(presentPreviewAsset(await response.json(), preview.assetId, window.location.origin))
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
    if (disabled) return
    dispatchFields({ path: path(name), type: 'UPDATE', value })
    setModified(true)
  }
  const customizedPaths = breakpoint === 'desktop' ? [] : ['focalX', 'focalY', 'zoom', 'fit', 'frame']
    .map(name => path(name)).filter(fieldPath => formFields[fieldPath]?.value != null)
  const resetToDesktop = () => {
    if (disabled || customizedPaths.length === 0) return
    for (const fieldPath of customizedPaths) dispatchFields({ path: fieldPath, type: 'UPDATE', value: null })
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
      <div className={styles.inheritance}>
        <p role="status">{breakpoint === 'desktop'
          ? 'Encuadre base para escritorio. Móvil y tablet lo usan salvo sus ajustes propios.'
          : customizedPaths.length === 0
            ? 'Usa el encuadre de escritorio. Si cambias un control, solo se personaliza este formato.'
            : `${customizedPaths.length} ${customizedPaths.length === 1 ? 'ajuste propio' : 'ajustes propios'} para ${breakpoint === 'mobile' ? 'móvil' : 'tablet'}. Los demás siguen el escritorio.`}</p>
        {breakpoint !== 'desktop' && <button type="button" disabled={disabled || customizedPaths.length === 0} onClick={resetToDesktop}>Usar encuadre de escritorio</button>}
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
          <label htmlFor={`${controlId}-x`}>Punto focal horizontal <output htmlFor={`${controlId}-x`}>{Math.round(preview?.focalX ?? 50)}%</output><input disabled={disabled} id={`${controlId}-x`} min="0" max="100" step="1" type="range" value={preview?.focalX ?? 50} onChange={(event) => update('focalX', Number(event.target.value) / 100)} /></label>
          <label htmlFor={`${controlId}-y`}>Punto focal vertical <output htmlFor={`${controlId}-y`}>{Math.round(preview?.focalY ?? 50)}%</output><input disabled={disabled} id={`${controlId}-y`} min="0" max="100" step="1" type="range" value={preview?.focalY ?? 50} onChange={(event) => update('focalY', Number(event.target.value) / 100)} /></label>
          <label htmlFor={`${controlId}-zoom`}>Zoom <output htmlFor={`${controlId}-zoom`}>{(preview?.zoom ?? 1).toFixed(2)}×</output><input disabled={disabled} id={`${controlId}-zoom`} min="1" max="4" step="0.05" type="range" value={preview?.zoom ?? 1} onChange={(event) => update('zoom', Number(event.target.value))} /></label>
          <label>Ajuste<select disabled={disabled} value={preview?.fit ?? 'cover'} onChange={(event) => update('fit', event.target.value)}>{MEDIA_FITS.map((value) => <option key={value} value={value}>{value === 'cover' ? 'Cubrir' : 'Contener'}</option>)}</select></label>
          <label>Proporción<select disabled={disabled} value={preview?.frame ?? 'auto'} onChange={(event) => update('frame', event.target.value)}>{MEDIA_FRAMES.map((value) => <option key={value} value={value}>{value === 'auto' ? 'Original' : value}</option>)}</select></label>
        </div>
      </div>
    </section>
  )
}
