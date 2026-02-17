import { JsonSchema } from "./manifest"

export function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Response must be a JSON object")
  }
}

export function validateSchema(schema: JsonSchema | undefined, payload: Record<string, unknown>) {
  if (!schema) return true
  if (schema.type !== "object") throw new Error("Schema must be type object")
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in payload)) throw new Error(`Missing required field: ${key}`)
    }
  }
  return true
}
