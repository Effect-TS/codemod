import type { namedTypes } from "ast-types/gen/namedTypes"
import type { NodePath } from "ast-types/lib/node-path"
import type cs from "jscodeshift"
import * as Utils from "../Utils"

type ASTPath<N> = NodePath<N, N>

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift

  const root = j(file.source)

  const schemaNamespace = Utils.orElse(
    Utils.getNamespaceImport(file, api, "@effect/schema/Schema", false),
    () => Utils.getNamedImport(file, api, "@effect/schema", "Schema", false),
  )

  const replaceRecordArguments = (path: ASTPath<namedTypes.CallExpression>) => {
    const args = path.value.arguments
    const key = args[0]
    const value = args[1]
    path.value.arguments = [
      j.objectExpression([
        j.objectProperty(j.identifier("key"), key as any),
        j.objectProperty(j.identifier("value"), value as any),
      ]),
    ]
  }

  const replaceTaggedRequestArguments = (
    path: ASTPath<namedTypes.CallExpression>,
  ) => {
    const args = path.value.arguments
    const newArgs = j.objectExpression([
      j.property("init", j.identifier("failure"), args[1] as any),
      j.property("init", j.identifier("success"), args[2] as any),
      j.property("init", j.identifier("payload"), args[3] as any),
    ])
    path.value.arguments = [args[0], newArgs]
  }

  if (schemaNamespace) {
    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "Record" },
      },
    }).forEach(replaceRecordArguments)

    root.find(j.ClassDeclaration).forEach(path => {
      return j(path).find(j.CallExpression, {
        callee: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: {
              name: schemaNamespace,
            },
            property: {
              name: "TaggedRequest",
            },
          },
        },
      }).forEach(replaceTaggedRequestArguments)
    })
  }

  const directRecordImport = Utils.getNamedImport(
    file,
    api,
    "@effect/schema/Schema",
    "Record",
    false,
  )
  if (directRecordImport) {
    root.find(j.CallExpression, {
      callee: {
        name: directRecordImport,
      },
    }).forEach(replaceRecordArguments)
  }

  const directTaggedRequestImport = Utils.getNamedImport(
    file,
    api,
    "@effect/schema/Schema",
    "TaggedRequest",
    false,
  )
  if (directTaggedRequestImport) {
    root.find(j.CallExpression, {
      callee: {
        type: "CallExpression",
        callee: {
          name: directTaggedRequestImport,
        },
      },
    }).forEach(replaceTaggedRequestArguments)
  }

  return root.toSource()
}
