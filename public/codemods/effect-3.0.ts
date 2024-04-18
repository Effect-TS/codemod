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

  Utils.renameMembers(api, root, "Channel", "unit", "void")
  Utils.renameMembers(api, root, "Channel", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "Effect", "unit", "void")
  Utils.renameMembers(api, root, "Effect", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "Exit", "unit", "void")
  Utils.renameMembers(api, root, "Exit", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "Option", "unit", "void")
  Utils.renameMembers(api, root, "Option", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "Schedule", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "STM", "unit", "void")
  Utils.renameMembers(api, root, "STM", "asUnit", "asVoid")
  Utils.renameMembers(api, root, "Stream", "unit", "void")

  return root.toSource()
}
