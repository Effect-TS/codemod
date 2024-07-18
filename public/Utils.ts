import type { ExpressionKind } from "ast-types/gen/kinds"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"

export const orElse = <A>(
  x: A | undefined,
  f: () => A | undefined,
): A | undefined => x === undefined ? f() : x

/**
 * - given `import * as Namespace from "source"` returns "Namespace"
 * - given `import type * as Namespace from "source"` returns "Namespace"
 */
export const getNamespaceImport = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
  type: boolean,
): string | undefined => {
  const j = api.jscodeshift
  const importDeclarations = findImportDeclarations(file, api, source, type)
  if (importDeclarations.length > 0) {
    const name = importDeclarations.find(j.Identifier).get(0).node.name
    if (typeof name === "string") {
      return name
    }
  }
  return undefined
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
): string | undefined => {
  const importDeclarations = findImportDeclarations(file, api, source, type)
  let out: string | undefined = undefined
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
  return out
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

export const renameMember = (ast: ExpressionKind, name: string): void => {
  switch (ast.type) {
    case "Identifier": {
      ast.name = name
      return
    }
    case "MemberExpression": {
      return renameMember(ast.property, name)
    }
    default: {
      return
    }
  }
}

export const renameMembers = (
  api: cs.API,
  ast: Collection<any>,
  object: string,
  fromProp: string,
  toProp: string,
) => {
  const j = api.jscodeshift
  ast.find(j.MemberExpression).filter(_ =>
    _.node.object.type === "Identifier" && _.node.object.name === object
  ).filter(_ =>
    _.node.property.type === "Identifier" && _.node.property.name === fromProp
  ).forEach(ast => {
    renameMember(ast.value, toProp)
  })
}
