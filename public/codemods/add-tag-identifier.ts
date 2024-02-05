import type cs from "jscodeshift"

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  root.find(j.VariableDeclaration).forEach(ast => {
    writeTagIdentifier(ast, j)
  })

  return root.toSource()
}

const writeTagIdentifier = (
  ast: cs.ASTPath<cs.VariableDeclaration>,
  j: cs.API["jscodeshift"],
) => {
  if (ast.value.declarations.length === 1) {
    const declaration = ast.value.declarations[0]
    if (
      declaration.type === "VariableDeclarator"
      && declaration.init
      && declaration.init.type === "CallExpression"
    ) {
      const init = declaration.init
      const callee = init.callee
      const isTag = (node: typeof callee): boolean => {
        switch (node.type) {
          case "Identifier": {
            return node.name === "Tag"
          }
          case "MemberExpression": {
            return isTag(node.property)
          }
          default: {
            return false
          }
        }
      }
      if (
        isTag(callee)
        && init.arguments.length === 0
        && declaration.id.type === "Identifier"
      ) {
        init.arguments.push(j.stringLiteral(`@services/${declaration.id.name}`))
      }
    }
  }
}
