import * as TestUtils from "jscodeshift/src/testUtils"
import { describe } from "vitest"

import transformer from "../public/codemods/schema-0.69"

const expectTransformation = (
  description: string,
  input: string,
  output: string,
) => {
  TestUtils.defineInlineTest(
    { default: transformer, parser: "ts" },
    {},
    input,
    output,
    description,
  )
}

describe("Record", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Record(Schema.String, Schema.Number)`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Record({
  key: Schema.String,
  value: Schema.Number
})`,
  )
  expectTransformation(
    "named import renamed",
    `import { Schema as S } from "@effect/schema"
const schema = S.Record(S.String, S.Number)`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Record({
  key: S.String,
  value: S.Number
})`,
  )
  expectTransformation(
    "namespace import",
    `import * as Schema from "@effect/schema/Schema"
const schema = Schema.Record(Schema.String, Schema.Number)`,
    `import * as Schema from "@effect/schema/Schema"
const schema = Schema.Record({
  key: Schema.String,
  value: Schema.Number
})`,
  )
  expectTransformation(
    "namespace import renamed",
    `import * as S from "@effect/schema/Schema"
const schema = S.Record(S.String, S.Number)`,
    `import * as S from "@effect/schema/Schema"
const schema = S.Record({
  key: S.String,
  value: S.Number
})`,
  )
  expectTransformation(
    "direct import",
    `import { Record, String, Number } from "@effect/schema/Schema"
const schema = Record(String, Number)`,
    `import { Record, String, Number } from "@effect/schema/Schema"
const schema = Record({
  key: String,
  value: Number
})`,
  )
  expectTransformation(
    "direct import renamed",
    `import { Record as R, String, Number } from "@effect/schema/Schema"
const schema = R(String, Number)`,
    `import { Record as R, String, Number } from "@effect/schema/Schema"
const schema = R({
  key: String,
  value: Number
})`,
  )
  expectTransformation(
    "nested",
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Record(Schema.String, Schema.Number) })`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Record({
  key: Schema.String,
  value: Schema.Number
}) })`,
  )
})

describe("TaggedRequest", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
class UserList extends Schema.TaggedRequest<UserList>()(
  "UserList",
  Schema.String,
  Schema.Array(User),
  {}
) {}`,
    `import { Schema } from "@effect/schema"
class UserList extends Schema.TaggedRequest<UserList>()("UserList", {
  failure: Schema.String,
  success: Schema.Array(User),
  payload: {}
}) {}`,
  )
  expectTransformation(
    "direct import renamed",
    `import { TaggedRequest as TR, String, Array } from "@effect/schema/Schema"
class UserList extends TR<UserList>()(
  "UserList",
  String,
  Array(User),
  {}
) {}`,
    `import { TaggedRequest as TR, String, Array } from "@effect/schema/Schema"
class UserList extends TR<UserList>()("UserList", {
  failure: String,
  success: Array(User),
  payload: {}
}) {}`,
  )
})

describe("NonEmpty", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.NonEmpty`,
    `import { Schema } from "@effect/schema"
const schema = Schema.NonEmptyString`,
  )
})

describe("nonEmpty()", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.nonEmpty())`,
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.nonEmptyString())`,
  )
})

describe("optional()", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.optional())`,
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.optional)`,
  )
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
  const schema = Schema.optional(Schema.String)`,
    `import { Schema } from "@effect/schema"
  const schema = Schema.optional(Schema.String)`,
  )
})

describe("optional({ ... }) / optional(schema, { ... })", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.optional({ exact: true }))`,
    `import { Schema } from "@effect/schema"
const schema = Schema.String.pipe(Schema.optionalWith({ exact: true }))`,
  )
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.optional(Schema.String, { exact: true })`,
    `import { Schema } from "@effect/schema"
const schema = Schema.optionalWith(Schema.String, { exact: true })`,
  )
})

describe("partial()", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Number }).pipe(Schema.partial())`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Number }).pipe(Schema.partial)`,
  )
  expectTransformation(
    "named import",
    `import { Schema as S } from "@effect/schema"
const schema = S.Struct({ a: S.Number }).pipe(S.partial())`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Struct({ a: S.Number }).pipe(S.partial)`,
  )
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.partial(Schema.Struct({ a: Schema.Number }))`,
    `import { Schema } from "@effect/schema"
const schema = Schema.partial(Schema.Struct({ a: Schema.Number }))`,
  )
})

describe("partial({ ... }) / optional(partial, { ... })", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Number }).pipe(Schema.partial({ exact: true }))`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Struct({ a: Schema.Number }).pipe(Schema.partialWith({ exact: true }))`,
  )
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.partial(Schema.Struct({ a: Schema.Number }), { exact: true })`,
    `import { Schema } from "@effect/schema"
const schema = Schema.partialWith(Schema.Struct({ a: Schema.Number }), { exact: true })`,
  )
})

describe("Base64 -> Uint8ArrayFromBase64", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Base64`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Uint8ArrayFromBase64`,
  )
})

describe("Base64Url -> Uint8ArrayFromBase64Url", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Base64Url`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Uint8ArrayFromBase64Url`,
  )
})

describe("Hex -> Uint8ArrayFromHex", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.Hex`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Uint8ArrayFromHex`,
  )
})

describe("CauseDefectUnknown -> Defect", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.CauseDefectUnknown`,
    `import { Schema } from "@effect/schema"
const schema = Schema.Defect`,
  )
})

describe("ExitFromSelf", () => {
  expectTransformation(
    "explicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({ failure: S.String, success: S.Number, defect: S.Unknown })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({ failure: S.String, success: S.Number, defect: S.Unknown })`,
  )
  expectTransformation(
    "explicit defect with CauseDefectUnknown",
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({ failure: S.String, success: S.Number, defect: S.CauseDefectUnknown })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({ failure: S.String, success: S.Number, defect: S.Defect })`,
  )
  expectTransformation(
    "implicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({ failure: S.String, success: S.Number })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.ExitFromSelf({
  failure: S.String,
  success: S.Number,
  defect: S.Defect
})`,
  )
})

describe("Exit", () => {
  expectTransformation(
    "explicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.Exit({ failure: S.String, success: S.Number, defect: S.Unknown })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Exit({ failure: S.String, success: S.Number, defect: S.Unknown })`,
  )
  expectTransformation(
    "implicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.Exit({ failure: S.String, success: S.Number })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Exit({
  failure: S.String,
  success: S.Number,
  defect: S.Defect
})`,
  )
})

describe("CauseFromSelf", () => {
  expectTransformation(
    "explicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.CauseFromSelf({ error: S.NumberFromString, defect: S.Unknown })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.CauseFromSelf({ error: S.NumberFromString, defect: S.Unknown })`,
  )
  expectTransformation(
    "implicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.CauseFromSelf({ error: S.NumberFromString })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.CauseFromSelf({
  error: S.NumberFromString,
  defect: S.Defect
})`,
  )
})

describe("Cause", () => {
  expectTransformation(
    "explicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.Cause({ error: S.NumberFromString, defect: S.Unknown })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Cause({ error: S.NumberFromString, defect: S.Unknown })`,
  )
  expectTransformation(
    "implicit defect",
    `import { Schema as S } from "@effect/schema"
const schema = S.Cause({ error: S.NumberFromString })`,
    `import { Schema as S } from "@effect/schema"
const schema = S.Cause({
  error: S.NumberFromString,
  defect: S.Defect
})`,
  )
})
