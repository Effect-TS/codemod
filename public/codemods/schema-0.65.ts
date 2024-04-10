/**
 * test: npx jscodeshift -d -p -t ./public/codemods/schema-0.65.ts test/schema-0.65/NamespaceImport.ts
 */

import type cs from "jscodeshift"

const findNamespaceName = (
  file: cs.FileInfo,
  api: cs.API,
  sources: ReadonlyArray<unknown>,
): string | undefined => {
  const j = api.jscodeshift
  const importDeclarations = j(file.source).find(j.ImportDeclaration).filter(
    path => sources.includes(path.value.source.value),
  )
  if (importDeclarations.length > 0) {
    const name = importDeclarations.find(j.Identifier).get(0).node.name
    if (typeof name === "string") {
      return name
    }
  }
  return undefined
}

// a `null` value means `key.charAt(0).toUpperCase() + key.slice(1)`
const MemberExpressions = {
  struct: null,
  string: null,
}

const isMemberExpression = (
  key: string,
): key is keyof typeof MemberExpressions => key in MemberExpressions

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift

  const namespaceName = findNamespaceName(file, api, [
    "@effect/schema/Schema",
    "@effect/schema",
  ])
  if (namespaceName === undefined) {
    return file.source
  }

  const root = j(file.source)

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
            if (isMemberExpression(key)) {
              const value: string | null = MemberExpressions[key]
              property.name = value === null
                ? key.charAt(0).toUpperCase() + key.slice(1)
                : value
            }
          }
        }
      }
    })

  return root.toSource()
}
