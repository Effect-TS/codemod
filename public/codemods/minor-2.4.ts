import type k from "ast-types/gen/kinds.js"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  forEveryTypeReference(root, j, ast => {
    swapParams(ast, "Either", 2)
    swapSchedule(ast)
  })

  return root.toSource()
}

//
// utilities
//

const swapSchedule = (
  ast: cs.ASTPath<cs.TSTypeReference>,
) => {
  if (
    hasName(ast, "Schedule") && ast.value.typeParameters?.params.length === 3
  ) {
    const params = ast.value.typeParameters.params
    params.reverse()
    if (params[2].type === "TSNeverKeyword") {
      popNever(params)
      if (params[1].type === "TSUnknownKeyword") {
        popUnknown(params)
      }
    }
  }
}

const swapParams = (
  ast: cs.ASTPath<cs.TSTypeReference>,
  name: string,
  size: number,
) => {
  if (hasName(ast, name) && ast.value.typeParameters?.params.length === size) {
    const params = ast.value.typeParameters.params
    params.reverse()
    for (let i = 0; i < size - 1; i++) {
      popNever(params)
    }
  }
}

const popNever = (params: Array<k.TSTypeKind>) => {
  if (
    params.length > 0
    && params[params.length - 1].type === "TSNeverKeyword"
  ) {
    params.pop()
  }
}

const popUnknown = (params: Array<k.TSTypeKind>) => {
  if (
    params.length > 0
    && params[params.length - 1].type === "TSUnknownKeyword"
  ) {
    params.pop()
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
