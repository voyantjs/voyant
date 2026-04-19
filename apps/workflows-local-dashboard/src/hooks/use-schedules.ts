import { useEffect, useState } from "react"
import { fetchSchedules, type ScheduleSummary } from "@/lib/api"

/** Polls /api/schedules at a fixed cadence so next-fire countdowns stay fresh. */
export function useSchedules(intervalMs: number = 5_000): ScheduleSummary[] {
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([])
  useEffect(() => {
    let cancelled = false
    const load = (): void => {
      fetchSchedules()
        .then((s) => {
          if (!cancelled) setSchedules(s)
        })
        .catch(() => {})
    }
    load()
    const timer = setInterval(load, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [intervalMs])
  return schedules
}
