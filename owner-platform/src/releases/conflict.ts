import { APIError } from 'payload'

export class ReleaseAlreadyRegistered extends APIError {
  constructor() { super('Este commit ya tiene una versión registrada. Consulta el historial de versiones.', 409) }
}
