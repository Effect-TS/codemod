import { Schema } from "@effect/schema"

export const schema = Schema.transform(
  Schema.string,
  Schema.number,
  () => 0,
  () => "",
)
