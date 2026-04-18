export type ExclusiveExecutionResult<T> = { executed: true; value: T } | { executed: false }

export interface ExecutionLockManager {
  runExclusive<T>(key: string, task: () => Promise<T>): Promise<ExclusiveExecutionResult<T>>
  dispose?(): Promise<void>
}

export function createInMemoryExecutionLockManager(): ExecutionLockManager {
  const activeKeys = new Set<string>()

  return {
    async runExclusive<T>(key: string, task: () => Promise<T>) {
      if (activeKeys.has(key)) {
        return { executed: false }
      }

      activeKeys.add(key)
      try {
        return {
          executed: true,
          value: await task(),
        }
      } finally {
        activeKeys.delete(key)
      }
    },
  }
}
