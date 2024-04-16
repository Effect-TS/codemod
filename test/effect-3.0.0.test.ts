import { describe } from "vitest"
import * as Utils from "../src/Utils"

import transformer from "../public/codemods/effect-3.0.0"

const expectTransformation = Utils.expectTransformation(transformer)

describe("ReadonlyArray -> Array", () => {
  expectTransformation(
    `import * as ReadonlyArray from "effect/ReadonlyArray`,
    `import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import * as ReadonlyArray from "effect/Array"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import type * as ReadonlyArray from "effect/ReadonlyArray`,
    `import type * as ReadonlyArray from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import type * as ReadonlyArray from "effect/Array"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import { range } from "effect/ReadonlyArray`,
    `import { range } from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import { range } from "effect/Array"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray`,
    `import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import type { NonEmptyReadonlyArray } from "effect/Array"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import { ReadonlyArray, Option } from "effect`,
    `import { ReadonlyArray, Option } from "effect"`,
    `import { Array as ReadonlyArray, Option } from "effect"`,
  )

  expectTransformation(
    `import type { ReadonlyArray, Option } from "effect`,
    `import type { ReadonlyArray, Option } from "effect"`,
    `import type { Array as ReadonlyArray, Option } from "effect"`,
  )

  expectTransformation(
    `import { ReadonlyArray as RA, Option } from "effect`,
    `import { ReadonlyArray as RA, Option } from "effect"`,
    `import { Array as RA, Option } from "effect"`,
  )
})

describe("ReadonlyRecord -> Record", () => {
  expectTransformation(
    `import * as ReadonlyRecord from "effect/ReadonlyRecord`,
    `import * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as Option from "effect/Option"`,
    `import * as ReadonlyRecord from "effect/Record"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import type * as ReadonlyRecord from "effect/ReadonlyRecord`,
    `import type * as ReadonlyRecord from "effect/ReadonlyRecord"
import * as Option from "effect/Option"`,
    `import type * as ReadonlyRecord from "effect/Record"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import { empty } from "effect/ReadonlyRecord`,
    `import { empty } from "effect/ReadonlyRecord"
import * as Option from "effect/Option"`,
    `import { empty } from "effect/Record"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import type { ReadonlyRecord } from "effect/ReadonlyRecord`,
    `import type { ReadonlyRecord } from "effect/ReadonlyRecord"
import * as Option from "effect/Option"`,
    `import type { ReadonlyRecord } from "effect/Record"
import * as Option from "effect/Option"`,
  )

  expectTransformation(
    `import { ReadonlyRecord Option } from "effect`,
    `import { ReadonlyRecord, Option } from "effect"`,
    `import { Record as ReadonlyRecord, Option } from "effect"`,
  )

  expectTransformation(
    `import type { ReadonlyRecord, Option } from "effect`,
    `import type { ReadonlyRecord, Option } from "effect"`,
    `import type { Record as ReadonlyRecord, Option } from "effect"`,
  )

  expectTransformation(
    `import type { ReadonlyRecord as RR, Option } from "effect`,
    `import type { ReadonlyRecord as RR, Option } from "effect"`,
    `import type { Record as RR, Option } from "effect"`,
  )
})
