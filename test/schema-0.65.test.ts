import * as TestUtils from "jscodeshift/src/TestUtils"
import { describe } from "vitest"

import transformer from "../public/codemods/schema-0.65"

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

describe("imports", () => {
  expectTransformation(
    "named import",
    `import { Schema } from "@effect/schema"
const schema = Schema.string`,
    `import { Schema } from "@effect/schema"
const schema = Schema.String`,
  )

  expectTransformation(
    "named import with binding",
    `import { Schema as S } from "@effect/schema"
const schema = S.string`,
    `import { Schema as S } from "@effect/schema"
const schema = S.String`,
  )

  expectTransformation(
    "namespace import",
    `import * as S from "@effect/schema/Schema"
const schema = S.string`,
    `import * as S from "@effect/schema/Schema"
const schema = S.String`,
  )
})

describe("consolidate schema names", () => {
  expectTransformation(
    "string",
    `import * as S from "@effect/schema/Schema"
const schema = S.string`,
    `import * as S from "@effect/schema/Schema"
const schema = S.String`,
  )

  expectTransformation(
    "APIs with /bigint/ig",
    `import * as S from "@effect/schema/Schema"
const schema1 = S.bigintFromSelf
const schema2 = S.NonNegativeBigintFromSelf`,
    `import * as S from "@effect/schema/Schema"
const schema1 = S.BigIntFromSelf
const schema2 = S.NonNegativeBigIntFromSelf`,
  )

  expectTransformation(
    "struct",
    `import * as S from "@effect/schema/Schema"
const schema = S.struct({})`,
    `import * as S from "@effect/schema/Schema"
const schema = S.Struct({})`,
  )

  expectTransformation(
    "array",
    `import * as S from "@effect/schema/Schema"
const schema = S.array({})`,
    `import * as S from "@effect/schema/Schema"
const schema = S.Array({})`,
  )
})

describe("transform", () => {
  expectTransformation(
    "transform",
    `import { Schema } from "@effect/schema"

const schema = Schema.transform(
  Schema.string,
  Schema.number,
  () => 0,
  () => "",
)`,
    `import { Schema } from "@effect/schema"

const schema = Schema.transform(Schema.String, Schema.Number, {
  decode: () => 0,
  encode: () => ""
})`,
  )

  expectTransformation(
    "transform ({ strict: false })",
    `import { Schema } from "@effect/schema"

const schema = Schema.transform(
  Schema.string,
  Schema.number,
  () => 0,
  () => "",
  { strict: false },
)`,
    `import { Schema } from "@effect/schema"

const schema = Schema.transform(Schema.String, Schema.Number, {
  strict: false,
  decode: () => 0,
  encode: () => ""
})`,
  )

  expectTransformation(
    "transform (pipeable)",
    `import { Schema } from "@effect/schema"

const schema = Schema.string.pipe(Schema.transform(
  Schema.number,
  () => 0,
  () => "",
))`,
    `import { Schema } from "@effect/schema"

const schema = Schema.String.pipe(Schema.transform(Schema.Number, {
  decode: () => 0,
  encode: () => ""
}))`,
  )

  expectTransformation(
    "transform (pipeable, { strict: false })",
    `import { Schema } from "@effect/schema"

const schema = Schema.string.pipe(Schema.transform(
  Schema.number,
  () => 0,
  () => "",
  { strict: false },
))`,
    `import { Schema } from "@effect/schema"

const schema = Schema.String.pipe(Schema.transform(Schema.Number, {
  strict: false,
  decode: () => 0,
  encode: () => ""
}))`,
  )
})

describe("transformOrFail", () => {
  expectTransformation(
    "transformOrFail",
    `import { ParseResult, Schema } from "@effect/schema"

const schema = Schema.transformOrFail(
  Schema.string,
  Schema.number,
  () => ParseResult.succeed(0),
  () => ParseResult.succeed(""),
)`,
    `import { ParseResult, Schema } from "@effect/schema"

const schema = Schema.transformOrFail(Schema.String, Schema.Number, {
  decode: () => ParseResult.succeed(0),
  encode: () => ParseResult.succeed("")
})`,
  )

  expectTransformation(
    "transformOrFail ({ strict: false })",
    `import { ParseResult, Schema } from "@effect/schema"

const schema = Schema.transformOrFail(
  Schema.string,
  Schema.number,
  () => ParseResult.succeed(0),
  () => ParseResult.succeed(""),
  { strict: false },
)`,
    `import { ParseResult, Schema } from "@effect/schema"

const schema = Schema.transformOrFail(Schema.String, Schema.Number, {
  strict: false,
  decode: () => ParseResult.succeed(0),
  encode: () => ParseResult.succeed("")
})`,
  )

  expectTransformation(
    "transformOrFail (pipeable)",
    `import { Schema } from "@effect/schema"

const schema = Schema.string.pipe(Schema.transformOrFail(
  Schema.number,
  () => ParseResult.succeed(0),
  () => ParseResult.succeed(""),
))`,
    `import { Schema } from "@effect/schema"

const schema = Schema.String.pipe(Schema.transformOrFail(Schema.Number, {
  decode: () => ParseResult.succeed(0),
  encode: () => ParseResult.succeed("")
}))`,
  )

  expectTransformation(
    "transformOrFail (pipeable, { strict: false })",
    `import { Schema } from "@effect/schema"

const schema = Schema.string.pipe(Schema.transformOrFail(
  Schema.number,
  () => ParseResult.succeed(0),
  () => ParseResult.succeed(""),
  { strict: false },
))`,
    `import { Schema } from "@effect/schema"

const schema = Schema.String.pipe(Schema.transformOrFail(Schema.Number, {
  strict: false,
  decode: () => ParseResult.succeed(0),
  encode: () => ParseResult.succeed("")
}))`,
  )
})

describe("declare", () => {
  expectTransformation(
    "declare",
    `import { ParseResult, Schema } from "@effect/schema"

export const schema1 = Schema.declare((u): u is File => u instanceof File)

export const schema2 = <Value extends Schema.Schema.Any>(
  value: Value,
) => {
  return Schema.declare(
    [value],
    value => ParseResult.decodeUnknown(value),
    value => ParseResult.encodeUnknown(value),
  )
}`,
    `import { ParseResult, Schema } from "@effect/schema"

export const schema1 = Schema.Declare((u): u is File => u instanceof File)

export const schema2 = <Value extends Schema.Schema.Any>(
  value: Value,
) => {
  return Schema.Declare([value], {
    decode: value => ParseResult.decodeUnknown(value),
    encode: value => ParseResult.encodeUnknown(value)
  });
}`,
  )
})

describe.skip("Class.transformOrFail*", () => {
  expectTransformation(
    "Class.transformOrFail*",
    `import { ParseResult, Schema } from "@effect/schema"

class A extends Schema.Class<A>("A")({
  a: Schema.string,
}) {}

class B extends A.transformOrFail<B>("B")(
  { b: Schema.number },
  () => ParseResult.succeed({ a: "a", b: 1 }),
  () => ParseResult.succeed({ a: "a" }),
) {}

class C extends A.transformOrFailFrom<C>("C")(
  { b: Schema.number },
  () => ParseResult.succeed({ a: "a", b: 1 }),
  () => ParseResult.succeed({ a: "a" }),
) {}`,
    `import { ParseResult, Schema } from "@effect/schema"

class A extends Schema.Class<A>("A")({
  a: Schema.String,
}) {}

class B extends A.transformOrFail<B>("B")(
  { b: Schema.Number },
  {
    decode: () => ParseResult.succeed({ a: "a", b: 1 }),
    encode: () => ParseResult.succeed({ a: "a" }),
  }
) {}

class C extends A.transformOrFailFrom<C>("C")(
  { b: Schema.Number },
  {
    decode: () => ParseResult.succeed({ a: "a", b: 1 }),
    encode: () => ParseResult.succeed({ a: "a" }),
  }
) {}`,
  )
})
