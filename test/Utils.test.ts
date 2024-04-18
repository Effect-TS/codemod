import * as Option from "effect/Option"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"
import { describe } from "vitest"
import * as Utils from "../src/Utils"

const addOutput = (api: cs.API, ast: Collection<any>, value: string) => {
  const j = api.jscodeshift
  const newConst = j.variableDeclaration("const", [
    j.variableDeclarator(j.identifier("output"), j.stringLiteral(value)),
  ])
  ast.find(j.Program).get("body", 0).insertAfter(newConst)
}

describe("getNamespaceImport", () => {
  const T = (type: boolean) => (file: cs.FileInfo, api: cs.API) => {
    const j = api.jscodeshift
    const ast = j(file.source)

    addOutput(
      api,
      ast,
      Option.getOrElse(
        Utils.getNamespaceImport(file, api, "source", type),
        () => "NOT_FOUND",
      ),
    )

    return ast.toSource()
  }

  Utils.expectTransformation(T(false))(
    `import * as Namespace from "xxx" (type = false)`,
    `import * as Namespace from "xxx"`,
    `import * as Namespace from "xxx"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(true))(
    `import type * as Namespace from "xxx" (type = true)`,
    `import type * as Namespace from "xxx"`,
    `import type * as Namespace from "xxx"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(false))(
    `import * as Namespace from "source" (type = false)`,
    `import * as Namespace from "source"`,
    `import * as Namespace from "source"
const output = "Namespace";`,
  )

  Utils.expectTransformation(T(true))(
    `import * as Namespace from "source" (type = true)`,
    `import * as Namespace from "source"`,
    `import * as Namespace from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(false))(
    `import type * as Namespace from "source" (type = false)`,
    `import type * as Namespace from "source"`,
    `import type * as Namespace from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(true))(
    `import type * as Namespace from "source" (type = true)`,
    `import type * as Namespace from "source"`,
    `import type * as Namespace from "source"
const output = "Namespace";`,
  )
})

describe("getNamedImport", () => {
  const T = (type: boolean) => (file: cs.FileInfo, api: cs.API) => {
    const j = api.jscodeshift
    const ast = j(file.source)

    addOutput(
      api,
      ast,
      Option.getOrElse(
        Utils.getNamedImport(file, api, "source", "Named", type),
        () => "NOT_FOUND",
      ),
    )

    return ast.toSource()
  }

  Utils.expectTransformation(T(false))(
    `import { Named } from "source" (type = false)`,
    `import { Named } from "source"`,
    `import { Named } from "source"
const output = "Named";`,
  )

  Utils.expectTransformation(T(false))(
    `import { Named as N } from "source" (type = false)`,
    `import { Named as N } from "source"`,
    `import { Named as N } from "source"
const output = "N";`,
  )

  Utils.expectTransformation(T(false))(
    `import type { Named } from "source" (type = false)`,
    `import type { Named } from "source"`,
    `import type { Named } from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(false))(
    `import type { Named as N } from "source" (type = false)`,
    `import type { Named as N } from "source"`,
    `import type { Named as N } from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(true))(
    `import { Named } from "source" (type = true)`,
    `import { Named } from "source"`,
    `import { Named } from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(true))(
    `import { Named as N } from "source" (type = true)`,
    `import { Named as N } from "source"`,
    `import { Named as N } from "source"
const output = "NOT_FOUND";`,
  )

  Utils.expectTransformation(T(true))(
    `import type { Named } from "source" (type = true)`,
    `import type { Named } from "source"`,
    `import type { Named } from "source"
const output = "Named";`,
  )

  Utils.expectTransformation(T(true))(
    `import type { Named as N } from "source" (type = true)`,
    `import type { Named as N } from "source"`,
    `import type { Named as N } from "source"
const output = "N";`,
  )
})

describe("replaceImportSource", () => {
  const T = (file: cs.FileInfo, api: cs.API) => {
    const j = api.jscodeshift
    const ast = j(file.source)
    Utils.replaceImportSource(
      api,
      ast,
      "effect/ReadonlyArray",
      "effect/Array",
    )
    return ast.toSource()
  }

  Utils.expectTransformation(T)(
    `import * as ReadonlyArray from "effect/ReadonlyArray`,
    `import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import * as ReadonlyArray from "effect/Array"
import * as Option from "effect/Option"`,
  )

  Utils.expectTransformation(T)(
    `import type * as ReadonlyArray from "effect/ReadonlyArray`,
    `import type * as ReadonlyArray from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import type * as ReadonlyArray from "effect/Array"
import * as Option from "effect/Option"`,
  )

  Utils.expectTransformation(T)(
    `import { range } from "effect/ReadonlyArray`,
    `import { range } from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import { range } from "effect/Array"
import * as Option from "effect/Option"`,
  )

  Utils.expectTransformation(T)(
    `import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray`,
    `import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray"
import * as Option from "effect/Option"`,
    `import type { NonEmptyReadonlyArray } from "effect/Array"
import * as Option from "effect/Option"`,
  )
})

describe("replaceNamedImport", () => {
  const T = (file: cs.FileInfo, api: cs.API) => {
    const j = api.jscodeshift
    const ast = j(file.source)
    Utils.replaceNamedImport(
      api,
      ast,
      "effect",
      "ReadonlyArray",
      "Array",
    )
    return ast.toSource()
  }

  Utils.expectTransformation(T)(
    `import { ReadonlyArray, Option } from "effect`,
    `import { ReadonlyArray, Option } from "effect"`,
    `import { Array as ReadonlyArray, Option } from "effect"`,
  )

  Utils.expectTransformation(T)(
    `import type { ReadonlyArray, Option } from "effect`,
    `import type { ReadonlyArray, Option } from "effect"`,
    `import type { Array as ReadonlyArray, Option } from "effect"`,
  )
})
