import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  forEveryTypeReference(root, j, ast => {
    patchSchema(ast, j)
  })

  return root.toSource()
}

//
// utilities
//

const patchSchema = (
  ast: cs.ASTPath<cs.TSTypeReference>,
  j: cs.API["jscodeshift"],
) => {
  if (hasName(ast, "Schema") && ast.value.typeParameters?.params.length === 2) {
    const params = ast.value.typeParameters.params
    ast.value.typeParameters.params = [j.tsNeverKeyword(), ...params]
  }
}

const hasName = (reference: cs.ASTPath<cs.TSTypeReference>, name: string) => {
  const initial = reference.value.typeName
  const loop = (node: typeof initial): boolean => {
    switch (node.type) {
      case "Identifier": {
        return node.name === name
      }
      case "JSXIdentifier": {
        return false
      }
      case "TSQualifiedName": {
        return loop(node.right)
      }
      case "TSTypeParameter": {
        return false
      }
    }
  }
  return loop(initial)
}

//
// this is needed to resolve a bug in jscodeshift that
// forgets to traverse type parameters in call expressions
//

declare module "ast-types/gen/namedTypes" {
  namespace namedTypes {
    interface CallExpression extends TSHasOptionalTypeParameterInstantiation {}
  }
}

const forEveryTypeReference = (
  node: Collection<any>,
  j: cs.API["jscodeshift"],
  f: (ast: cs.ASTPath<cs.TSTypeReference>) => void,
) => {
  const visited = new Set()
  node.find(j.TSTypeReference).forEach(ast => {
    if (!visited.has(ast)) {
      visited.add(ast)
      f(ast)
    }
  })
  node.find(j.CallExpression).forEach(path => {
    const typeParams = path.value.typeParameters
    if (typeParams) {
      j(typeParams).find(j.TSTypeReference).forEach(ast => {
        if (!visited.has(ast)) {
          visited.add(ast)
          f(ast)
        }
      })
    }
  })
}
