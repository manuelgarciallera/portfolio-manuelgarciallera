import type { GlobalConfig } from 'payload'

import { ownerOnly } from '../access/owner'
import { ASSIST_CAPABILITIES } from '../assist/contracts'

const labels: Record<(typeof ASSIST_CAPABILITIES)[number], string> = {
  suggestCopy: 'Sugerir textos',
  suggestPalette: 'Sugerir paleta',
  suggestLayout: 'Sugerir composición',
  suggestCrop: 'Sugerir encuadre',
  suggestMotion: 'Sugerir movimiento',
}

export const AssistantSettings: GlobalConfig = {
  slug: 'assistant-settings',
  admin: {
    description:
      'Permisos para generar propuestas. Aplicar, publicar y desplegar nunca se conceden al asistente.',
  },
  access: {
    read: ownerOnly,
    update: ownerOnly,
  },
  versions: {
    max: 50,
  },
  fields: ASSIST_CAPABILITIES.map((name) => ({
    name,
    type: 'checkbox' as const,
    defaultValue: false,
    label: labels[name],
  })),
}
