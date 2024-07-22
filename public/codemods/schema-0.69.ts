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

  if (schemaNamespace) {
    // ---------------------------------------------------------------
    // Record(key, value) -> Record({ key, value })
    // ---------------------------------------------------------------

    const replaceRecordArguments = (
      path: ASTPath<namedTypes.CallExpression>,
    ) => {
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

    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "Record" },
      },
    }).forEach(replaceRecordArguments)

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

    // ---------------------------------------------------------------
    // TaggedRequest(failure, success, payload) -> TaggedRequest({ failure, success, payload })
    // ---------------------------------------------------------------

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

    // ---------------------------------------------------------------
    // Schema.NonEmpty -> Schema.NonEmptyString
    // ---------------------------------------------------------------

    Utils.renameMembers(
      api,
      root,
      schemaNamespace,
      "NonEmpty",
      "NonEmptyString",
    )

    // ---------------------------------------------------------------
    // Schema.nonEmpty() -> Schema.nonEmptyString()
    // ---------------------------------------------------------------

    Utils.renameMembers(
      api,
      root,
      schemaNamespace,
      "nonEmpty",
      "nonEmptyString",
    )

    // ---------------------------------------------------------------
    // Schema.optional({ ... }) -> Schema.optionalWith({ ... })
    // Schema.optional(schema, { ... }) -> Schema.optionalWith(schema, { ... })
    // ---------------------------------------------------------------

    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "optional" },
      },
    }).forEach(path => {
      const args = path.value.arguments
      if (
        (args.length === 1 && args[0].type === "ObjectExpression")
        || (args.length === 2 && args[1].type === "ObjectExpression")
      ) {
        path.value.callee = j.memberExpression(
          j.identifier(schemaNamespace),
          j.identifier("optionalWith"),
        )
      }
    })

    // ---------------------------------------------------------------
    // Schema.optional() -> Schema.optional
    // ---------------------------------------------------------------

    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "optional" },
      },
    }).forEach(path => {
      const args = path.value.arguments
      if (args.length === 0) {
        path.replace(j.memberExpression(
          j.identifier(schemaNamespace),
          j.identifier("optional"),
        ))
      }
    })

    // ---------------------------------------------------------------
    // Schema.partial({ ... }) -> Schema.partialWith({ ... })
    // Schema.partial(schema, { ... }) -> Schema.partialWith(schema, { ... })
    // ---------------------------------------------------------------

    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "partial" },
      },
    }).forEach(path => {
      const args = path.value.arguments
      if (
        (args.length === 1 && args[0].type === "ObjectExpression")
        || (args.length === 2 && args[1].type === "ObjectExpression")
      ) {
        path.value.callee = j.memberExpression(
          j.identifier(schemaNamespace),
          j.identifier("partialWith"),
        )
      }
    })

    // ---------------------------------------------------------------
    // Schema.partial() -> Schema.partial
    // ---------------------------------------------------------------

    root.find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: schemaNamespace },
        property: { name: "partial" },
      },
    }).forEach(path => {
      const args = path.value.arguments
      if (args.length === 0) {
        path.replace(j.memberExpression(
          j.identifier(schemaNamespace),
          j.identifier("partial"),
        ))
      }
    })
  }

  return root.toSource()
}
