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
