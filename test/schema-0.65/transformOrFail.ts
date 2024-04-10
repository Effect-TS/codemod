import { ParseResult, Schema } from "@effect/schema"

export const schema = Schema.transformOrFail(
  Schema.string,
  Schema.number,
  () => ParseResult.succeed(0),
  () => ParseResult.succeed(""),
)
