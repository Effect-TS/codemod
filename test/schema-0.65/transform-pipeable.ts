import { Schema } from "@effect/schema"

export const schema = Schema.string.pipe(Schema.transform(
  Schema.number,
  () => 0,
  () => "",
))
