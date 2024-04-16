import * as Option from "effect/Option"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"
import * as TestUtils from "jscodeshift/src/TestUtils"

export const expectTransformation = (transformer: cs.Transform) =>
(
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

/**
 * - given `import * as Namespace from "source"` returns "Namespace"
 * - given `import type * as Namespace from "source"` returns "Namespace"
 */
export const getNamespaceImport = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
  type: boolean,
): Option.Option<string> => {
  const j = api.jscodeshift
  const importDeclarations = findImportDeclarations(file, api, source, type)
  if (importDeclarations.length > 0) {
    const name = importDeclarations.find(j.Identifier).get(0).node.name
    if (typeof name === "string") {
      return Option.some(name)
    }
  }
  return Option.none()
}

const findImportDeclarations = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
  type: boolean,
) => {
  const j = api.jscodeshift
  return j(file.source).find(j.ImportDeclaration, {
    source: { value: source },
  }).filter(path =>
    type ? path.value.importKind === "type" : path.value.importKind === "value"
  )
}

/**
 * - given `import { Named } from "source"` returns "Named"
 * - given `import { Named as N } from "source"` returns "N"
 * - given `import type { Named } from "source"` returns "Named"
 * - given `import type { Named as N } from "source"` returns "N"
 */
export const getNamedImport = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
  name: string,
  type: boolean,
): Option.Option<string> => {
  const importDeclarations = findImportDeclarations(file, api, source, type)
  let out: string | null = null
  importDeclarations.forEach(path => {
    const specifiers = path.value.specifiers
    if (specifiers) {
      for (const specifier of specifiers) {
        if (specifier.type === "ImportSpecifier") {
          if (specifier.imported.name === name) {
            if (specifier.local) {
              out = specifier.local.name
            } else {
              out = name
            }
            break
          }
        }
      }
    }
  })
  return Option.fromNullable(out)
}

/**
 * - replaces `import * as Name from "<fromSource>` with `import * as Name from "<toSource>`
 * - replaces `import { Name } from "<fromSource>` with `import { Name } from "<toSource>`
 */
export const replaceImportSource = (
  api: cs.API,
  ast: Collection<any>,
  fromSource: string,
  toSource: string,
) => {
  const j = api.jscodeshift
  ast.find(j.ImportDeclaration).forEach(path => {
    if (path.node.source.value === fromSource) {
      path.node.source = j.literal(toSource)
    }
  })
}

/**
 * - replaces `import { <from> } from "<source>"` with `import { <to> as <from> } from "<source>"`
 * - replaces `import type { <from> } from "<source>"` with `import type { <to> as <from> } from "<source>"`
 */
export const replaceNamedImport = (
  api: cs.API,
  ast: Collection<any>,
  source: string,
  from: string,
  to: string,
) => {
  const j = api.jscodeshift
  ast.find(j.ImportDeclaration, { source: { value: source } }).forEach(path => {
    path.node.specifiers?.forEach(s => {
      if (s.type === "ImportSpecifier") {
        if (s.imported.name === from) {
          s.imported.name = to
          s.name = j.identifier(from)
        }
      }
    })
  })
}