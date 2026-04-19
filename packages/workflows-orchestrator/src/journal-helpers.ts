import type { JournalSlice } from "@voyantjs/workflows/protocol"

export function emptyJournal(): JournalSlice {
  return {
    stepResults: {},
    waitpointsResolved: {},
    compensationsRun: {},
    metadataState: {},
    streamsCompleted: {},
  }
}
