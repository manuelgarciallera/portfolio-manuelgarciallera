import { validations, type RichTextFieldValidation } from 'payload'

/** Keep Lexical's node validation while allowing the saved block canvas to replace the legacy body. */
export const validateModularBody = (layoutField: 'articleLayout' | 'caseStudyLayout'): RichTextFieldValidation =>
  (value, options) => {
    const siblings = options.siblingData as Record<string, unknown> | undefined
    const layout = siblings?.[layoutField]
    return validations.richText(value, {
      ...options,
      required: !(Array.isArray(layout) && layout.length > 0),
    })
  }
