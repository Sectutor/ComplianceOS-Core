export type ToolRequest = {
  clientId: string
  context: { id: string }
  data?: Record<string, unknown>
}

export type ToolResponse = {
  ok: boolean
  result?: Record<string, unknown>
  citations?: Array<{ source: string; snippet?: string }>
  error?: { code: string; message: string }
}

export interface ToolHandler {
  name: string
  handle(req: ToolRequest): Promise<ToolResponse>
}

export interface PipelineStage {
  name: string
  run(input: Record<string, unknown>): Promise<Record<string, unknown>>
}

export interface ScannerRunner {
  name: string
  execute(params: Record<string, unknown>): Promise<Record<string, unknown>>
}

export interface PlaybookDefinition {
  name: string
  trigger: string
  actions: string[]
  requiresApproval?: boolean
}
