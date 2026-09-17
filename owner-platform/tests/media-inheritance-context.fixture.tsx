import { createContext, useContext, useState, type ReactNode } from 'react'

type Fields = Record<string, { value: unknown }>
type Update = { path: string; type: string; value: unknown }
const Context = createContext<[Fields, (update: Update) => void]>([{}, () => {}])
export const Provider = ({ children }: { children: ReactNode }) => {
  const [fields, setFields] = useState<Fields>(() => Object.fromEntries(Object.entries({
    'placement.asset': 12, 'placement.focalX': 1, 'placement.focalY': 0.5,
    'placement.zoom': 1, 'placement.fit': 'cover', 'placement.frame': '4:3',
    'placement.overrides.mobile.zoom': 4, 'placement.overrides.mobile.focalY': 0,
    'placement.overrides.tablet.zoom': 2,
  }).map(([path, value]) => [path, { value }])))
  return <Context.Provider value={[fields, update => setFields(previous => ({ ...previous, [update.path]: { value: update.value } }))]}>{children}</Context.Provider>
}
export const useFormFields = () => useContext(Context)
export const useForm = () => ({ setModified: () => {} })
export const useFormProcessing = () => new URLSearchParams(location.search).get('mode') === 'saving'
export const useFormInitializing = () => new URLSearchParams(location.search).get('mode') === 'initializing'
