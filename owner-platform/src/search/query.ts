export const parseOwnerSearchQuery = (url: URL): string => {
  const keys = [...url.searchParams.keys()]
  if (keys.some((key) => key !== 'q') || url.searchParams.getAll('q').length !== 1) {
    throw new TypeError('Parámetros de búsqueda no válidos.')
  }

  const query = url.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 80) throw new TypeError('La búsqueda debe tener entre 2 y 80 caracteres.')
  return query
}
