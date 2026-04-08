export async function timeOperation<T>(
  label: string,
  promise: Promise<T>,
  warnOverMs = 200,
): Promise<T> {
  const start = performance.now?.() ?? Date.now()
  try {
    const result = await promise
    const end = performance.now?.() ?? Date.now()
    const duration = end - start
    if (duration > warnOverMs) {
      console.warn(`[db] slow operation: ${label} took ${duration.toFixed(1)}ms`)
    }
    return result
  } catch (err) {
    const end = performance.now?.() ?? Date.now()
    const duration = end - start
    console.error(`[db] failed operation: ${label} after ${duration.toFixed(1)}ms`, err)
    throw err
  }
}
