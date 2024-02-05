import type k from "ast-types/gen/kinds.js"
import type cs from "jscodeshift"

const enabled = {
  swapEitherParams: true,
  swapEffectParams: true,
  writeTagIdentifier: true,
}

const swapEitherParams = (ast: cs.ASTPath<cs.TSTypeReference>) => {
  const name = ast.value.typeName
  const isEither = (node: typeof name): boolean => {
    switch (node.type) {
      case "Identifier": {
        if (node.name === "Either") {
          return true
        }
        return false
      }
      case "JSXIdentifier": {
        return false
      }
      case "TSQualifiedName": {
        return isEither(node.right)
      }
      case "TSTypeParameter": {
        return false
      }
    }
  }
  if (
    isEither(name)
    && ast.value.typeParameters
    && ast.value.typeParameters.params.length === 2
  ) {
    const params = ast.value.typeParameters.params
    const newParams = [params[1], params[0]]
    popNever(newParams)
    ast.value.typeParameters.params = newParams
  }
}

const swapEffectParams = (ast: cs.ASTPath<cs.TSTypeReference>) => {
  const name = ast.value.typeName
  const isEffect = (node: typeof name): boolean => {
    switch (node.type) {
      case "Identifier": {
        return node.name === "Effect"
      }
      case "JSXIdentifier": {
        return false
      }
      case "TSQualifiedName": {
        return isEffect(node.right)
      }
      case "TSTypeParameter": {
        return false
      }
    }
  }
  if (
    isEffect(name)
    && ast.value.typeParameters
    && ast.value.typeParameters.params.length === 3
  ) {
    const params = ast.value.typeParameters.params
    const newParams = [params[2], params[1], params[0]]
    popNever(newParams)
    popNever(newParams)
    ast.value.typeParameters.params = newParams
  }
}

const popNever = (params: Array<k.TSTypeKind>) => {
  if (
    params.length > 0 && params[params.length - 1].type === "TSNeverKeyword"
  ) {
    params.pop()
  }
}

const writeTagIdentifier = (
  ast: cs.ASTPath<cs.VariableDeclaration>,
  j: cs.API["jscodeshift"],
) => {
  if (ast.value.declarations.length === 1) {
    const declaration = ast.value.declarations[0]
    if (
      declaration.type === "VariableDeclarator" && declaration.init
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
        isTag(callee) && init.arguments.length === 0
        && declaration.id.type === "Identifier"
      ) {
        init.arguments.push(j.stringLiteral(`@services/${declaration.id.name}`))
      }
    }
  }
}

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  const forEveryTypeReference = (
    node: typeof root,
    f: (ast: cs.ASTPath<cs.TSTypeReference>) => void,
  ) => {
    node.find(j.TSTypeReference).forEach(ast => {
      f(ast)
    })
    node.find(j.CallExpression).forEach(path => {
      const typeParams = (path.value as any)
        .typeParameters as cs.TSTypeParameterInstantiation
      if (typeParams) {
        j(typeParams).find(j.TSTypeReference).forEach(tref => {
          f(tref)
        })
      }
    })
  }

  forEveryTypeReference(root, ast => {
    if (enabled.swapEffectParams) {
      swapEffectParams(ast)
    }
    if (enabled.swapEitherParams) {
      swapEitherParams(ast)
    }
  })

  root.find(j.VariableDeclaration).forEach(ast => {
    if (enabled.writeTagIdentifier) {
      writeTagIdentifier(ast, j)
    }
  })

  return root.toSource()
}
