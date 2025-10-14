export const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const urlSearchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlSearchParams.set(key, String(value))
    }
  })

  return urlSearchParams.toString()
}
