import { useEffect, useRef } from "react"

import type { DiagramSnapshot } from "@/lib/diagram-types"
import { saveProject } from "@/lib/projects-store"

const AUTOSAVE_DELAY_MS = 500

export function useAutosave(projectId: string | null, snapshot: DiagramSnapshot) {
  const latestSnapshot = useRef(snapshot)

  useEffect(() => {
    latestSnapshot.current = snapshot
  }, [snapshot])

  useEffect(() => {
    if (!projectId) {
      return
    }

    const timeout = window.setTimeout(() => {
      try {
        saveProject(projectId, latestSnapshot.current)
      } catch (error) {
        console.error("Autosave failed", error)
      }
    }, AUTOSAVE_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [projectId, snapshot])
}
