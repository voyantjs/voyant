// Combined initial-fetch + SSE subscription for /api/runs.
//
// On mount: seed the map from /api/runs, then open an EventSource to
// /api/runs/stream and merge `snapshot` / `added` / `updated` /
// `removed` / `stream.chunk` events into the same map.

import { useEffect, useState } from "react"
import { API_BASE, fetchRuns, type StoredRun, type StreamChunk } from "@/lib/api"

export interface RunsStream {
  runs: Map<string, StoredRun> | undefined
  error: string | undefined
  live: boolean
  updateRun: (run: StoredRun) => void
}

export function useRunsStream(): RunsStream {
  const [runs, setRuns] = useState<Map<string, StoredRun> | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [live, setLive] = useState<boolean>(false)

  useEffect(() => {
    fetchRuns().then(
      (list) => setRuns(new Map(list.map((r) => [r.id, r]))),
      (e) => setError(String(e)),
    )

    const source = new EventSource(`${API_BASE}/api/runs/stream`)

    const onOpen = (): void => setLive(true)
    const onError = (): void => setLive(false)

    const onSnapshot = (e: MessageEvent<string>): void => {
      const ev = JSON.parse(e.data) as { runs: StoredRun[] }
      setRuns(new Map(ev.runs.map((r) => [r.id, r])))
    }

    const onAddedOrUpdated = (e: MessageEvent<string>): void => {
      const ev = JSON.parse(e.data) as { run: StoredRun }
      setRuns((prev) => {
        const next = new Map(prev ?? [])
        next.set(ev.run.id, ev.run)
        return next
      })
    }

    const onRemoved = (e: MessageEvent<string>): void => {
      const ev = JSON.parse(e.data) as { runId: string }
      setRuns((prev) => {
        if (!prev) return prev
        const next = new Map(prev)
        next.delete(ev.runId)
        return next
      })
    }

    const onChunk = (e: MessageEvent<string>): void => {
      const ev = JSON.parse(e.data) as { runId: string; chunk: StreamChunk }
      setRuns((prev) => {
        if (!prev) return prev
        const run = prev.get(ev.runId)
        if (!run) return prev
        const existing = run.result.streams?.[ev.chunk.streamId] ?? []
        const nextRun: StoredRun = {
          ...run,
          result: {
            ...run.result,
            streams: {
              ...(run.result.streams ?? {}),
              [ev.chunk.streamId]: [...existing, ev.chunk],
            },
          },
        }
        const next = new Map(prev)
        next.set(ev.runId, nextRun)
        return next
      })
    }

    source.addEventListener("open", onOpen)
    source.addEventListener("error", onError)
    source.addEventListener("snapshot", onSnapshot as EventListener)
    source.addEventListener("added", onAddedOrUpdated as EventListener)
    source.addEventListener("updated", onAddedOrUpdated as EventListener)
    source.addEventListener("removed", onRemoved as EventListener)
    source.addEventListener("stream.chunk", onChunk as EventListener)

    return () => {
      source.close()
    }
  }, [])

  const updateRun = (run: StoredRun): void => {
    setRuns((prev) => {
      const next = new Map(prev ?? [])
      next.set(run.id, run)
      return next
    })
  }

  return { runs, error, live, updateRun }
}
