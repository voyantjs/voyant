import { useEffect, useState } from "react"
import { fetchWorkflows, type WorkflowSummary } from "@/lib/api"

export function useWorkflows(): WorkflowSummary[] {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  useEffect(() => {
    fetchWorkflows()
      .then(setWorkflows)
      .catch(() => {})
  }, [])
  return workflows
}
