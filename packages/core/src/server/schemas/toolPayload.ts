import { z } from "zod"

export const ToolPayloadSchema = z.object({
  clientId: z.number(),
  context: z.object({
    id: z.string()
  }),
  data: z.record(z.any()).optional()
})

export type ToolPayload = z.infer<typeof ToolPayloadSchema>
