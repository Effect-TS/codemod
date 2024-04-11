/**
 * test: npx jscodeshift -d -p -t ./public/codemods/schema-0.65.ts test/schema-0.65/NamespaceImport.ts
 */

import type { namedTypes } from "ast-types/gen/namedTypes"
import type { NodePath } from "ast-types/lib/node-path"
import type cs from "jscodeshift"

type ASTPath<N> = NodePath<N, N>

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift

  let namespaceName = findNamespaceImport(file, api, "@effect/schema/Schema")
  if (namespaceName === undefined) {
    namespaceName = findNamedImport(file, api, "@effect/schema", "Schema")
  }
  if (namespaceName === undefined) {
    return file.source
  }

  const root = j(file.source)

  // struct -> Struct, string -> String, etc...
  root
    .find(j.MemberExpression)
    .forEach(path => {
      const expr = path.value
      const object = expr.object
      if (object.type === "Identifier") {
        if (object.name === namespaceName) {
          const property = expr.property
          if (property.type === "Identifier") {
            const key = property.name
            // handle API with /bigint/ig
            if (/bigint/ig.test(key)) {
              property.name = property.name.replace(/bigint/ig, "BigInt")
            } else if (isMemberExpression(key)) {
              const value: string | null = MemberExpressions[key]
              property.name = value === null
                ? key.charAt(0).toUpperCase() + key.slice(1)
                : value
            }
          }
        }
      }
    })

  const strictFalseObjectProperty = j.objectProperty(
    j.identifier("strict"),
    j.booleanLiteral(false),
  )

  const replaceTransformFunctions = (
    path: ASTPath<namedTypes.CallExpression>,
  ) => {
    const args = path.value.arguments
    const hasStrictFalse = args[args.length - 1].type === "ObjectExpression"
    if (hasStrictFalse) {
      if (args.length === 5) {
        const decodeFn = args[2]
        const encodeFn = args[3]
        if (
          decodeFn.type !== "SpreadElement"
          && encodeFn.type !== "SpreadElement"
        ) {
          args.splice(
            2,
            3,
            j.objectExpression([
              strictFalseObjectProperty,
              j.objectProperty(j.identifier("decode"), decodeFn),
              j.objectProperty(j.identifier("encode"), encodeFn),
            ]),
          )
        }
      } else if (args.length === 4) {
        const decodeFn = args[1]
        const encodeFn = args[2]
        if (
          decodeFn.type !== "SpreadElement"
          && encodeFn.type !== "SpreadElement"
        ) {
          args.splice(
            1,
            3,
            j.objectExpression([
              strictFalseObjectProperty,
              j.objectProperty(j.identifier("decode"), decodeFn),
              j.objectProperty(j.identifier("encode"), encodeFn),
            ]),
          )
        }
      }
    } else {
      if (args.length === 4) {
        const decodeFn = args[2]
        const encodeFn = args[3]
        if (
          decodeFn.type !== "SpreadElement"
          && encodeFn.type !== "SpreadElement"
        ) {
          args.splice(
            2,
            2,
            j.objectExpression([
              j.objectProperty(j.identifier("decode"), decodeFn),
              j.objectProperty(j.identifier("encode"), encodeFn),
            ]),
          )
        }
      } else if (args.length === 3) {
        const decodeFn = args[1]
        const encodeFn = args[2]
        if (
          decodeFn.type !== "SpreadElement"
          && encodeFn.type !== "SpreadElement"
        ) {
          args.splice(
            1,
            2,
            j.objectExpression([
              j.objectProperty(j.identifier("decode"), decodeFn),
              j.objectProperty(j.identifier("encode"), encodeFn),
            ]),
          )
        }
      }
    }
  }

  // transform
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: namespaceName },
        property: { name: "transform" },
      },
    })
    .forEach(replaceTransformFunctions)

  // transformOrFail
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: namespaceName },
        property: { name: "transformOrFail" },
      },
    })
    .forEach(replaceTransformFunctions)

  // declare
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: namespaceName },
        property: { name: "Declare" },
      },
    })
    .forEach((
      path: ASTPath<namedTypes.CallExpression>,
    ) => {
      const args = path.value.arguments
      if (args.length >= 3) {
        const decodeFn = args[1]
        const encodeFn = args[2]
        if (
          decodeFn.type !== "SpreadElement"
          && encodeFn.type !== "SpreadElement"
        ) {
          args.splice(
            1,
            2,
            j.objectExpression([
              j.objectProperty(j.identifier("decode"), decodeFn),
              j.objectProperty(j.identifier("encode"), encodeFn),
            ]),
          )
        }
      }
    })

  return root.toSource()
}

const findNamespaceImport = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
): string | undefined => {
  const j = api.jscodeshift
  const importDeclarations = j(file.source).find(j.ImportDeclaration, {
    source: { value: source },
  })
  if (importDeclarations.length > 0) {
    const name = importDeclarations.find(j.Identifier).get(0).node.name
    if (typeof name === "string") {
      return name
    }
  }
  return undefined
}

const findNamedImport = (
  file: cs.FileInfo,
  api: cs.API,
  source: string,
  name: string,
): string | undefined => {
  const j = api.jscodeshift
  const importDeclarations = j(file.source).find(j.ImportDeclaration, {
    source: { value: source },
  })
  if (importDeclarations.length === 0) {
    return undefined
  }
  let out: string = name
  importDeclarations.forEach(path => {
    const specifiers = path.value.specifiers
    if (specifiers) {
      for (const specifier of specifiers) {
        if (specifier.type === "ImportSpecifier") {
          if (specifier.imported.name === name && specifier.local) {
            out = specifier.local.name
            break
          }
        }
      }
    }
  })
  return out
}

// a `null` value means `key.charAt(0).toUpperCase() + key.slice(1)`
const MemberExpressions = {
  literal: null,
  uniqueSymbolFromSelf: null,
  enums: null,
  templateLiteral: null,
  declare: null,
  instanceOf: null,
  undefined: null,
  void: null,
  null: null,
  never: null,
  unknown: null,
  any: null,
  string: null,
  number: null,
  boolean: null,
  symbolFromSelf: null,
  object: null,
  union: null,
  nullable: null,
  orUndefined: null,
  nullish: null,
  keyof: null,
  optionalElement: null,
  tuple: null,
  array: null,
  nonEmptyArray: null,
  struct: null,
  record: null,
  suspend: null,
  symbol: null,
  optionFromSelf: null,
  option: null,
  optionFromNullable: null,
  optionFromNullish: null,
  optionFromOrUndefined: null,
  eitherFromSelf: null,
  either: null,
  eitherFromUnion: null,
  readonlyMapFromSelf: null,
  mapFromSelf: null,
  readonlyMap: null,
  map: null,
  readonlySetFromSelf: null,
  setFromSelf: null,
  readonlySet: null,
  set: null,
  chunkFromSelf: null,
  chunk: null,
  dataFromSelf: null,
  data: null,
  causeFromSelf: null,
  causeDefectUnknown: null,
  cause: null,
  exitFromSelf: null,
  exit: null,
  hashSetFromSelf: null,
  hashSet: null,
  hashMapFromSelf: null,
  hashMap: null,
  listFromSelf: null,
  list: null,
  sortedSetFromSelf: null,
  sortedSet: null,
}

const isMemberExpression = (
  key: string,
): key is keyof typeof MemberExpressions => key in MemberExpressions
