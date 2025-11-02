export const getErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === 'string') {
    return error || fallback
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallback
}
