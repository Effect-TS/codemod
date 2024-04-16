import type cs from "jscodeshift"
import * as Utils from "../../src/Utils"

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  Utils.replaceImportSource(
    api,
    root,
    "effect/ReadonlyArray",
    "effect/Array",
  )

  Utils.replaceImportSource(
    api,
    root,
    "effect/ReadonlyRecord",
    "effect/Record",
  )

  Utils.replaceNamedImport(
    api,
    root,
    "effect",
    "ReadonlyArray",
    "Array",
  )

  Utils.replaceNamedImport(
    api,
    root,
    "effect",
    "ReadonlyRecord",
    "Record",
  )

  return root.toSource()
}
