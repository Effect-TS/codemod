import * as TestUtils from "jscodeshift/src/testUtils"
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
    "no imports",
    `import { ParseResult } from "@effect/schema"
const f = ParseResult.parseError`,
    `import { ParseResult } from "@effect/schema"
const f = ParseResult.parseError`,
  )

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

describe("Schema.transform", () => {
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

describe("Schema.transformOrFail", () => {
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

describe("Schema.declare", () => {
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

export const schema1 = Schema.declare((u): u is File => u instanceof File)

export const schema2 = <Value extends Schema.Schema.Any>(
  value: Value,
) => {
  return Schema.declare([value], {
    decode: value => ParseResult.decodeUnknown(value),
    encode: value => ParseResult.encodeUnknown(value)
  });
}`,
  )
})

describe("Schema.optionalToRequired", () => {
  expectTransformation(
    "optionalToRequired",
    `import { Schema } from "@effect/schema"
import * as Option from "effect/Option"

const schema = Schema.optionalToRequired(
  Schema.nullable(Schema.string),
  Schema.string,
  Option.match({
    onNone: () => "",
    onSome: a => a === null ? "" : a,
  }),
  Option.some,
)`,
    `import { Schema } from "@effect/schema"
import * as Option from "effect/Option"

const schema = Schema.optionalToRequired(Schema.NullOr(Schema.String), Schema.String, {
  decode: Option.match({
    onNone: () => "",
    onSome: a => a === null ? "" : a,
  }),

  encode: Option.some
})`,
  )
})

describe("Schema.optionalToOptional", () => {
  expectTransformation(
    "optionalToOptional",
    `import { Schema } from "@effect/schema"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"

const schema = Schema.optionalToOptional(
  Schema.nullable(Schema.string),
  Schema.string,
  Option.filter(Predicate.isNotNull),
  a => a,
)`,
    `import { Schema } from "@effect/schema"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"

const schema = Schema.optionalToOptional(Schema.NullOr(Schema.String), Schema.String, {
  decode: Option.filter(Predicate.isNotNull),
  encode: a => a
})`,
  )
})

describe("Class.transformOrFail*", () => {
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

class B extends A.transformOrFail<B>("B")({ b: Schema.Number }, {
  decode: () => ParseResult.succeed({ a: "a", b: 1 }),
  encode: () => ParseResult.succeed({ a: "a" })
}) {}

class C extends A.transformOrFailFrom<C>("C")({ b: Schema.Number }, {
  decode: () => ParseResult.succeed({ a: "a", b: 1 }),
  encode: () => ParseResult.succeed({ a: "a" })
}) {}`,
  )
})

describe("TreeFormatter", () => {
  expectTransformation(
    "formatIssue / formatIssueEffect",
    `import { ParseResult, Schema, TreeFormatter } from "@effect/schema"

const message1 = TreeFormatter.formatIssueEffect(
  new ParseResult.Type(Schema.string.ast, null),
)

const message2 = TreeFormatter.formatIssue(
  new ParseResult.Type(Schema.string.ast, null),
)`,
    `import { ParseResult, Schema, TreeFormatter } from "@effect/schema"

const message1 = TreeFormatter.formatIssue(
  new ParseResult.Type(Schema.String.ast, null),
)

const message2 = TreeFormatter.formatIssueSync(
  new ParseResult.Type(Schema.String.ast, null),
)`,
  )

  expectTransformation(
    "formatError / formatErrorEffect",
    `import { ParseResult, Schema, TreeFormatter } from "@effect/schema"

const message1 = TreeFormatter.formatErrorEffect(
  ParseResult.parseError(new ParseResult.Type(Schema.string.ast, null)),
)

const message2 = TreeFormatter.formatError(
  ParseResult.parseError(new ParseResult.Type(Schema.string.ast, null)),
)`,
    `import { ParseResult, Schema, TreeFormatter } from "@effect/schema"

const message1 = TreeFormatter.formatError(
  ParseResult.parseError(new ParseResult.Type(Schema.String.ast, null)),
)

const message2 = TreeFormatter.formatErrorSync(
  ParseResult.parseError(new ParseResult.Type(Schema.String.ast, null)),
)`,
  )
})

describe("ArrayFormatter", () => {
  expectTransformation(
    "formatIssue / formatIssueEffect",
    `import { ParseResult, Schema, ArrayFormatter } from "@effect/schema"

const message1 = ArrayFormatter.formatIssueEffect(
  new ParseResult.Type(Schema.string.ast, null),
)

const message2 = ArrayFormatter.formatIssue(
  new ParseResult.Type(Schema.string.ast, null),
)`,
    `import { ParseResult, Schema, ArrayFormatter } from "@effect/schema"

const message1 = ArrayFormatter.formatIssue(
  new ParseResult.Type(Schema.String.ast, null),
)

const message2 = ArrayFormatter.formatIssueSync(
  new ParseResult.Type(Schema.String.ast, null),
)`,
  )

  expectTransformation(
    "formatError / formatErrorEffect",
    `import { ParseResult, Schema, ArrayFormatter } from "@effect/schema"

const message1 = ArrayFormatter.formatErrorEffect(
  ParseResult.parseError(new ParseResult.Type(Schema.string.ast, null)),
)

const message2 = ArrayFormatter.formatError(
  ParseResult.parseError(new ParseResult.Type(Schema.string.ast, null)),
)`,
    `import { ParseResult, Schema, ArrayFormatter } from "@effect/schema"

const message1 = ArrayFormatter.formatError(
  ParseResult.parseError(new ParseResult.Type(Schema.String.ast, null)),
)

const message2 = ArrayFormatter.formatErrorSync(
  ParseResult.parseError(new ParseResult.Type(Schema.String.ast, null)),
)`,
  )
})

describe("AST", () => {
  expectTransformation(
    "isTransform",
    `import { AST, Schema } from "@effect/schema"

const b = AST.isTransform(Schema.string.ast)`,
    `import { AST, Schema } from "@effect/schema"

const b = AST.isTransformation(Schema.String.ast)`,
  )
})

describe("ParseResult", () => {
  expectTransformation(
    "Tuple",
    `import { AST, ParseResult, Schema } from "@effect/schema"

const issue = new ParseResult.Tuple(new AST.TupleType([], [], true), null, [
  new ParseResult.Index(0, new ParseResult.Unexpected(Schema.string.ast)),
])`,
    `import { AST, ParseResult, Schema } from "@effect/schema"

const issue = new ParseResult.TupleType(new AST.TupleType([], [], true), null, [
  new ParseResult.Index(0, new ParseResult.Unexpected(Schema.String.ast)),
])`,
  )
})

describe.skip("change arguments", () => {
  expectTransformation(
    "EitheFromSelf",
    `import { Schema } from "@effect/schema"

const schema = Schema.eitherFromSelf({
  right: Schema.number,
  left: Schema.string,
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.EitherFromSelf({
  Right: Schema.Number,
  Left: Schema.String,
})`,
  )

  expectTransformation(
    "Either",
    `import { Schema } from "@effect/schema"

const schema = Schema.either({
  right: Schema.number,
  left: Schema.string,
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.Either({
  Right: Schema.Number,
  Left: Schema.String,
})`,
  )

  expectTransformation(
    "EitherFromUnion",
    `import { Schema } from "@effect/schema"

const schema = Schema.eitherFromUnion({
  right: Schema.number,
  left: Schema.string,
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.EitherFromUnion({
  Right: Schema.Number,
  Left: Schema.String,
})`,
  )

  expectTransformation(
    "ReadonlyMapFromSelf",
    `import { Schema } from "@effect/schema"

const schema = Schema.readonlyMapFromSelf({
  value: Schema.number,
  key: Schema.string,
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.ReadonlyMapFromSelf({
  Value: Schema.Number,
  Key: Schema.String,
})`,
  )

  expectTransformation(
    "ExitFromSelf",
    `import { Schema } from "@effect/schema"

const schema = Schema.exitFromSelf({
  success: Schema.number,
  failure: Schema.string,
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.ExitFromSelf({
  Success: Schema.Number,
  Failure: Schema.String,
})`,
  )

  expectTransformation(
    "ExitFromSelf (with defect)",
    `import { Schema } from "@effect/schema"

const schema = Schema.exitFromSelf({
  success: Schema.number,
  failure: Schema.string,
  defect: Schema.unknown
})`,
    `import { Schema } from "@effect/schema"

const schema = Schema.ExitFromSelf({
  Success: Schema.Number,
  Failure: Schema.String,
  Defect: Schema.Unknown
})`,
  )
})

describe("Arbitrary", () => {
  expectTransformation(
    "make -> makeLazy",
    `import { Arbitrary, Schema } from "@effect/schema"

const Person = Schema.struct({
  name: Schema.string,
  age: Schema.string.pipe(
    Schema.compose(Schema.NumberFromString),
    Schema.int(),
  ),
})

const arb = Arbitrary.make(Person)`,
    `import { Arbitrary, Schema } from "@effect/schema"

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.String.pipe(
    Schema.compose(Schema.NumberFromString),
    Schema.int(),
  ),
})

const arb = Arbitrary.makeLazy(Person)`,
  )

  expectTransformation(
    "Arbitrary.LazyArbitrary (namespace import)",
    `import type * as Arbitrary from "@effect/schema/Arbitrary"
import * as S from "@effect/schema/Schema"

const schema = S.string.annotations({
  arbitrary: (): Arbitrary.Arbitrary<string> => fc => fc.string(),
})`,
    `import type * as Arbitrary from "@effect/schema/Arbitrary"
import * as S from "@effect/schema/Schema"

const schema = S.String.annotations({
  arbitrary: (): Arbitrary.LazyArbitrary<string> => fc => fc.string(),
})`,
  )

  expectTransformation(
    "Arbitrary.LazyArbitrary (named import)",
    `import { Schema } from "@effect/schema"
import type { Arbitrary } from "@effect/schema"

const schema = Schema.string.annotations({
  arbitrary: (): Arbitrary.Arbitrary<string> => fc => fc.string(),
})`,
    `import { Schema } from "@effect/schema"
import type { Arbitrary } from "@effect/schema"

const schema = Schema.String.annotations({
  arbitrary: (): Arbitrary.LazyArbitrary<string> => fc => fc.string(),
})`,
  )

  expectTransformation(
    "Arbitrary.LazyArbitrary (type named import)",
    `import { Schema } from "@effect/schema"
import type { Arbitrary } from "@effect/schema/Arbitrary"

const schema = Schema.string.annotations({
  arbitrary: (): Arbitrary<string> => fc => fc.string(),
})`,
    `import { Schema } from "@effect/schema"
import type { LazyArbitrary } from "@effect/schema/Arbitrary"

const schema = Schema.String.annotations({
  arbitrary: (): LazyArbitrary<string> => fc => fc.string(),
})`,
  )

  expectTransformation(
    "Arbitrary.LazyArbitrary (type named import with binding)",
    `import { Schema } from "@effect/schema"
import type { Arbitrary as A } from "@effect/schema/Arbitrary"

const schema = Schema.string.annotations({
  arbitrary: (): A<string> => fc => fc.string(),
})`,
    `import { Schema } from "@effect/schema"
import type { LazyArbitrary as A } from "@effect/schema/Arbitrary"

const schema = Schema.String.annotations({
  arbitrary: (): A<string> => fc => fc.string(),
})`,
  )
})

describe("type-level", () => {
  expectTransformation(
    "S.struct<>",
    `import type * as S from "@effect/schema/Schema"

export function struct<Fields extends S.Struct.Fields>(
  fields: Fields,
): S.struct<Fields>
export function struct<Fields extends S.Struct.Fields>(
  fields: Fields,
): S.struct<Fields> {}`,
    `import type * as S from "@effect/schema/Schema"

export function struct<Fields extends S.Struct.Fields>(
  fields: Fields,
): S.Struct<Fields>
export function struct<Fields extends S.Struct.Fields>(
  fields: Fields,
): S.Struct<Fields> {}`,
  )

  expectTransformation(
    "null",
    `import type * as S from "@effect/schema/Schema"

type N = S.$null`,
    `import type * as S from "@effect/schema/Schema"

type N = S.Null`,
  )
})
