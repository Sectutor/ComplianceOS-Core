export type PluginScope =
  | "read:logs"
  | "write:tasks"
  | "write:evidence"
  | "run:scanner:zap"
  | "run:scanner:semgrep"
  | "run:scanner:trivy"
  | "ingest:syslog"
  | "ingest:winevent"
  | "slot:policy"
  | "slot:risk"
  | "slot:controls"

export type JsonSchema = {
  $id: string
  type: "object"
  properties: Record<string, unknown>
  required?: string[]
}

export type PluginManifest = {
  name: string
  version: string
  description?: string
  author?: string
  scopes: PluginScope[]
  extensionPoints: {
    tools?: string[]
    pipelines?: string[]
    scanners?: string[]
    slots?: string[]
    playbooks?: string[]
  }
  ioSchemas?: {
    input?: JsonSchema
    output?: JsonSchema
    examples?: Record<string, unknown>
  }
  budgets?: {
    cpuMillis?: number
    memoryMB?: number
    timeoutSec?: number
    allowEgress?: boolean
  }
  channels?: Array<"webchat">
}
