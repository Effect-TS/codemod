/**
 * test: npx jscodeshift -d -p -t ./public/codemods/schema-0.65.ts test/schema-0.65/NamespaceImport.ts
 */

import type { ExpressionKind } from "ast-types/gen/kinds"
import type { namedTypes } from "ast-types/gen/namedTypes"
import type { NodePath } from "ast-types/lib/node-path"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"

type ASTPath<N> = NodePath<N, N>

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift

  const root = j(file.source)

  const schemaNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/Schema"),
    () => findNamedImport(file, api, "@effect/schema", "Schema"),
  )

  if (schemaNamespace !== undefined) {
    // struct -> Struct, string -> String, etc...
    root
      .find(j.MemberExpression, { object: { name: schemaNamespace } })
      .forEach(path => {
        const expr = path.value
        const property = expr.property
        if (property.type === "Identifier") {
          const name = property.name
          // handle API with /bigint/ig
          if (/bigint/ig.test(name)) {
            property.name = property.name.replace(/bigint/ig, "BigInt")
          } else if (isSchemaNameChanged(name)) {
            const value: string | null = schemaChangedNames[name]
            property.name = value === null
              ? name.charAt(0).toUpperCase() + name.slice(1)
              : value
          }
        }
      })

    root
      .find(j.TSTypeReference, {
        typeName: { left: { name: schemaNamespace } },
      })
      .forEach(path => {
        const expr = path.value
        const typeName = expr.typeName
        if (typeName.type === "TSQualifiedName") {
          const right = typeName.right
          if (right.type === "Identifier") {
            const name = right.name
            if (/bigint/ig.test(name)) {
              right.name = right.name.replace(/bigint/ig, "BigInt")
            } else if (isTypeLevelSchemaNameChanged(name)) {
              const value: string | null = typeLevelSchemaChangedNames[name]
              right.name = value === null
                ? name.charAt(0).toUpperCase() + name.slice(1)
                : value
            }
          }
        }
      })

    // const changeArguments = (
    //   api: string,
    //   changes: Record<string, string>,
    // ) => {
    //   const calls = root.find(j.CallExpression, {
    //     callee: {
    //       type: "MemberExpression",
    //       object: { name: schemaNamespace },
    //       property: { name: api },
    //     },
    //   })
    //   calls.forEach(callExpression => {
    //     const arg = callExpression.node.arguments[0]
    //     if (arg.type === "ObjectExpression") {
    //       arg.properties.forEach(property => {
    //         if (property.type === "ObjectProperty") {
    //           if (property.key.type === "Identifier") {
    //             const key = property.key.name
    //             if (key in changes) {
    //               property.key.name = changes[key]
    //             }
    //           }
    //         }
    //       })
    //     }
    //   })
    // }

    // changeArguments("EitherFromSelf", { right: "Right", left: "Left" })
    // changeArguments("Either", { right: "Right", left: "Left" })
    // changeArguments("EitherFromUnion", { right: "Right", left: "Left" })
    // changeArguments("ReadonlyMapFromSelf", { key: "Key", value: "Value" })
    // changeArguments("MapFromSelf", { key: "Key", value: "Value" })
    // changeArguments("ReadonlyMap", { key: "Key", value: "Value" })
    // changeArguments("Map", { key: "Key", value: "Value" })
    // changeArguments("CauseFromSelf", { error: "Error", defect: "Defect" })
    // changeArguments("Cause", { error: "Error", defect: "Defect" })
    // changeArguments("ExitFromSelf", {
    //   failure: "Failure",
    //   success: "Success",
    //   defect: "Defect",
    // })
    // changeArguments("Exit", {
    //   failure: "Failure",
    //   success: "Success",
    //   defect: "Defect",
    // })
    // changeArguments("HashMapFromSelf", { key: "Key", value: "Value" })
    // changeArguments("HashMap", { key: "Key", value: "Value" })

    const getDecodeEncodeOptions = (
      decode: ExpressionKind,
      encode: ExpressionKind,
      strictFalse: boolean = false,
    ) => {
      const properties = [
        j.objectProperty(j.identifier("decode"), decode),
        j.objectProperty(j.identifier("encode"), encode),
      ]
      if (strictFalse) {
        properties.unshift(j.objectProperty(
          j.identifier("strict"),
          j.booleanLiteral(false),
        ))
      }
      return j.objectExpression(properties)
    }

    const replaceTransformAndTransformOfFailFunctions = (
      path: ASTPath<namedTypes.CallExpression>,
    ) => {
      const args = path.value.arguments
      const hasStrictFalse = args[args.length - 1].type === "ObjectExpression"
      if (hasStrictFalse) {
        if (args.length === 5) {
          const decode = args[2]
          const encode = args[3]
          if (
            decode.type !== "SpreadElement"
            && encode.type !== "SpreadElement"
          ) {
            args.splice(2, 3, getDecodeEncodeOptions(decode, encode, true))
          }
        } else if (args.length === 4) {
          const decode = args[1]
          const encode = args[2]
          if (
            decode.type !== "SpreadElement"
            && encode.type !== "SpreadElement"
          ) {
            args.splice(1, 3, getDecodeEncodeOptions(decode, encode, true))
          }
        }
      } else {
        if (args.length === 4) {
          const decode = args[2]
          const encode = args[3]
          if (
            decode.type !== "SpreadElement"
            && encode.type !== "SpreadElement"
          ) {
            args.splice(2, 2, getDecodeEncodeOptions(decode, encode))
          }
        } else if (args.length === 3) {
          const decode = args[1]
          const encode = args[2]
          if (
            decode.type !== "SpreadElement"
            && encode.type !== "SpreadElement"
          ) {
            args.splice(1, 2, getDecodeEncodeOptions(decode, encode))
          }
        }
      }
    }

    const find = (
      name: string,
      f: (
        path: ASTPath<namedTypes.CallExpression>,
      ) => void,
    ) =>
      root.find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: { name: schemaNamespace },
          property: { name },
        },
      }).forEach(f)

    find("transform", replaceTransformAndTransformOfFailFunctions)
    find("transformOrFail", replaceTransformAndTransformOfFailFunctions)

    find("declare", path => {
      const args = path.value.arguments
      if (args.length >= 3) {
        const decode = args[1]
        const encode = args[2]
        if (
          decode.type !== "SpreadElement"
          && encode.type !== "SpreadElement"
        ) {
          args.splice(1, 2, getDecodeEncodeOptions(decode, encode))
        }
      }
    })

    const replaceOptionalToFunctions = (
      path: ASTPath<namedTypes.CallExpression>,
    ) => {
      const args = path.value.arguments
      const decode = args[2]
      const encode = args[3]
      if (
        decode.type !== "SpreadElement"
        && encode.type !== "SpreadElement"
      ) {
        args.splice(2, 2, getDecodeEncodeOptions(decode, encode))
      }
    }

    find("optionalToRequired", replaceOptionalToFunctions)
    find("optionalToOptional", replaceOptionalToFunctions)

    // Class.transformOrFail / Class.transformOrFrom
    root.find(j.ClassDeclaration).forEach(classDeclaration => {
      const superClass = classDeclaration.node.superClass
      if (superClass) {
        if (superClass.type === "CallExpression") {
          const callee = superClass.callee
          if (callee.type === "CallExpression") {
            if (callee.callee.type === "MemberExpression") {
              const property = callee.callee.property
              if (property.type === "Identifier") {
                if (
                  property.name === "transformOrFail"
                  || property.name === "transformOrFailFrom"
                ) {
                  callee.type
                  const args = superClass.arguments
                  if (args.length === 3) {
                    const decode = args[1]
                    const encode = args[2]
                    if (
                      decode.type !== "SpreadElement"
                      && encode.type !== "SpreadElement"
                    ) {
                      args.splice(1, 2, getDecodeEncodeOptions(decode, encode))
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  const formatterChanges = (formatterNamespace: string) => {
    root
      .find(j.MemberExpression, { object: { name: formatterNamespace } })
      .forEach(path => {
        const expr = path.value
        const property = expr.property
        if (property.type === "Identifier") {
          const name = property.name
          if (isFormatterNameChanged(name)) {
            property.name = formatterChangedNames[name]
          }
        }
      })
  }

  const treeFormatterNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/TreeFormatter"),
    () => findNamedImport(file, api, "@effect/schema", "TreeFormatter"),
  )

  if (treeFormatterNamespace !== undefined) {
    formatterChanges(treeFormatterNamespace)
  }
  replaceNamespaceImport(
    api,
    root,
    "@effect/schema/TreeFormatter",
    "formatError",
    "formatErrorSync",
  )
  replaceNamespaceImport(
    api,
    root,
    "@effect/schema/TreeFormatter",
    "formatErrorEffect",
    "formatError",
  )

  const arrayFormatterNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/ArrayFormatter"),
    () => findNamedImport(file, api, "@effect/schema", "ArrayFormatter"),
  )

  if (arrayFormatterNamespace !== undefined) {
    formatterChanges(arrayFormatterNamespace)
  }
  replaceNamespaceImport(
    api,
    root,
    "@effect/schema/ArrayFormatter",
    "formatError",
    "formatErrorSync",
  )
  replaceNamespaceImport(
    api,
    root,
    "@effect/schema/ArrayFormatter",
    "formatErrorEffect",
    "formatError",
  )

  const astNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/AST"),
    () => findNamedImport(file, api, "@effect/schema", "AST"),
  )

  const astChanges = (astNamespace: string) => {
    root
      .find(j.MemberExpression, { object: { name: astNamespace } })
      .forEach(path => {
        const expr = path.value
        const property = expr.property
        if (property.type === "Identifier") {
          const name = property.name
          if (isASTNameChanged(name)) {
            property.name = astChangedNames[name]
          }
        }
      })
  }

  if (astNamespace !== undefined) {
    astChanges(astNamespace)
  }

  const parseResultNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/ParseResult"),
    () => findNamedImport(file, api, "@effect/schema", "ParseResult"),
  )

  const parseResultChanges = (parseResultNamespace: string) => {
    root
      .find(j.MemberExpression, { object: { name: parseResultNamespace } })
      .forEach(path => {
        const expr = path.value
        const property = expr.property
        if (property.type === "Identifier") {
          const name = property.name
          if (isParseResultNameChanged(name)) {
            property.name = parseResultChangedNames[name]
          }
        }
      })
  }

  if (parseResultNamespace !== undefined) {
    parseResultChanges(parseResultNamespace)
  }

  const arbitraryNamespace = orElse(
    findNamespaceImport(file, api, "@effect/schema/Arbitrary"),
    () => findNamedImport(file, api, "@effect/schema", "Arbitrary"),
  )

  const arbitraryChanges = (arbitraryNamespace: string) => {
    root
      .find(j.MemberExpression, { object: { name: arbitraryNamespace } })
      .forEach(path => {
        const expr = path.value
        const property = expr.property
        if (property.type === "Identifier") {
          const name = property.name
          if (isArbitraryNameChanged(name)) {
            property.name = arbitraryChangedNames[name]
          }
        }
      })
  }

  const arbitraryTypeLevelChanges = (arbitraryNamespace: string) => {
    root
      .find(j.TSTypeReference, {
        typeName: { left: { name: arbitraryNamespace } },
      })
      .forEach(path => {
        const expr = path.value
        const typeName = expr.typeName
        if (typeName.type === "TSQualifiedName") {
          const right = typeName.right
          if (right.type === "Identifier") {
            const name = right.name
            if (isTypeLevelArbitraryNameChanged(name)) {
              const value: string | null = typeLevelArbitraryChangedNames[name]
              right.name = value === null
                ? name.charAt(0).toUpperCase() + name.slice(1)
                : value
            }
          }
        }
      })
  }

  if (arbitraryNamespace !== undefined) {
    arbitraryChanges(arbitraryNamespace)
    arbitraryTypeLevelChanges(arbitraryNamespace)
  }

  const arbitraryImportDeclarations = root.find(j.ImportDeclaration, {
    source: { value: "@effect/schema/Arbitrary" },
  })
  if (arbitraryImportDeclarations.length > 0) {
    let name: string | null = null
    arbitraryImportDeclarations.forEach(path => {
      if (path.value.importKind === "type") {
        const specifiers = path.value.specifiers
        if (specifiers) {
          for (const specifier of specifiers) {
            if (specifier.type === "ImportSpecifier") {
              if (specifier.imported.name === "Arbitrary" && specifier.local) {
                specifier.imported.name = "LazyArbitrary"
                name = specifier.local.name
                break
              }
            }
          }
        }
      }
      if (name && name === "Arbitrary") {
        root
          .find(j.TSTypeReference).forEach(path => {
            const expr = path.value
            const typeName = expr.typeName
            if (typeName.type === "Identifier" && typeName.name === name) {
              typeName.name = "LazyArbitrary"
            }
          })
      }
    })
  }

  return root.toSource()
}

const orElse = <A>(x: A | undefined, f: () => A | undefined): A | undefined =>
  x === undefined ? f() : x

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

const replaceNamespaceImport = (
  api: cs.API,
  root: Collection<any>,
  source: string,
  from: string,
  to: string,
) => {
  const j = api.jscodeshift
  const importDeclarations = root.find(j.ImportDeclaration, {
    source: { value: source },
  })
  importDeclarations.forEach(path => {
    const specifiers = path.value.specifiers
    if (specifiers) {
      for (const specifier of specifiers) {
        if (specifier.type === "ImportSpecifier") {
          if (specifier.imported.name === from && specifier.local) {
            specifier.imported.name = to

            root.find(j.CallExpression, {
              callee: { name: from },
            }).forEach(path => {
              if (
                path.value.callee.type === "Identifier"
                && path.value.callee.name === from
              ) {
                path.value.callee.name = to
              }
            })

            break
          }
        }
      }
    }
  })
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
const schemaChangedNames = {
  uniqueSymbolFromSelf: null,
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
  nullable: "NullOr",
  orUndefined: "UndefinedOr",
  nullish: "NullishOr",
  tuple: null,
  array: null,
  nonEmptyArray: null,
  struct: null,
  record: null,
  symbol: null,
  optionFromSelf: null,
  option: null,
  optionFromNullable: "OptionFromNullOr",
  optionFromNullish: "OptionFromNullishOr",
  optionFromOrUndefined: "OptionFromUndefinedOr",
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
  literal: null,
  enums: null,
  templateLiteral: null,
}

const isSchemaNameChanged = (
  key: string,
): key is keyof typeof schemaChangedNames => key in schemaChangedNames

const typeLevelSchemaChangedNames = {
  literal: null,
  enums: null,
  $void: "Void",
  $undefined: "Undefined",
  $null: "Null",
  never: null,
  $unknown: "Unknown",
  $any: "Any",
  $string: "$String",
  $number: "$Number",
  $boolean: "$Boolean",
  symbolFromSelf: null,
  $object: "$Object",
  union: null,
  nullable: "NullOr",
  orUndefined: "UndefinedOr",
  nullish: "NullishOr",
  tupleType: null,
  tuple: null,
  array: "$Array",
  nonEmptyArray: null,
  typeLiteral: null,
  struct: null,
  record: "$Record",
  $symbol: "$Symbol",
  optionFromSelf: null,
  option: null,
  optionFromNullable: "OptionFromNullOr",
  optionFromNullish: "OptionFromNullishOr",
  optionFromOrUndefined: "OptionFromUndefinedOr",
  eitherFromSelf: null,
  either: null,
  eitherFromUnion: null,
  readonlyMapFromSelf: null,
  mapFromSelf: null,
  readonlyMap: "$ReadonlyMap",
  map: "$Map",
  readonlySetFromSelf: null,
  setFromSelf: null,
  readonlySet: "$ReadonlySet",
  set: "$Set",
  chunkFromSelf: null,
  chunk: null,
  causeFromSelf: null,
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

const isTypeLevelSchemaNameChanged = (
  key: string,
): key is keyof typeof typeLevelSchemaChangedNames =>
  key in typeLevelSchemaChangedNames

const formatterChangedNames = {
  formatIssue: "formatIssueSync",
  formatError: "formatErrorSync",
  formatIssueEffect: "formatIssue",
  formatErrorEffect: "formatError",
}

const isFormatterNameChanged = (
  key: string,
): key is keyof typeof formatterChangedNames => key in formatterChangedNames

const astChangedNames = {
  isTransform: "isTransformation",
}

const isASTNameChanged = (
  key: string,
): key is keyof typeof astChangedNames => key in astChangedNames

const parseResultChangedNames = {
  Tuple: "TupleType",
}

const isParseResultNameChanged = (
  key: string,
): key is keyof typeof parseResultChangedNames => key in parseResultChangedNames

const arbitraryChangedNames = {
  make: "makeLazy",
}

const isArbitraryNameChanged = (
  key: string,
): key is keyof typeof arbitraryChangedNames => key in arbitraryChangedNames

const typeLevelArbitraryChangedNames = {
  Arbitrary: "LazyArbitrary",
}

const isTypeLevelArbitraryNameChanged = (
  key: string,
): key is keyof typeof typeLevelArbitraryChangedNames =>
  key in typeLevelArbitraryChangedNames
