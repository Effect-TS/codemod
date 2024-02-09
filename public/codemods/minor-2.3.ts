import type k from "ast-types/gen/kinds.js"
import type cs from "jscodeshift"
import type { Collection } from "jscodeshift/src/Collection"

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift
  const root = j(file.source)

  forEveryTypeReference(root, j, ast => {
    swapParams(ast, "Effect", 3)
    swapParams(ast, "Stream", 3)
    swapParams(ast, "STM", 3)
    swapParams(ast, "STMGen", 3)
    swapParams(ast, "Layer", 3)
    swapParams(ast, "Exit", 2)
    swapParams(ast, "Take", 2)
    swapParams(ast, "Fiber", 2)
    swapParams(ast, "FiberRuntime", 2)
    swapParams(ast, "Request", 2)
    swapParams(ast, "Resource", 2)
    swapParams(ast, "TExit", 2)
    swapParams(ast, "Deferred", 2)
    swapParams(ast, "TDeferred", 2)
    swapParams(ast, "Pool", 2)
    swapSchema(ast, j)
    swapChannel(ast, j)
  })

  root.find(j.VariableDeclaration).forEach(ast => {
    fixTagIdentifier(ast, j)
  })

  root.find(j.CallExpression).forEach(ast => {
    swapFunctionCall(ast, "async", 3)
    swapFunctionCall(ast, "asyncEffect", 3)
    swapFunctionCall(ast, "asyncEither", 3)
    swapFunctionCall(ast, "asyncInterrupt", 3)
    swapFunctionCall(ast, "asyncOption", 3)
    swapFunctionCall(ast, "asyncScoped", 3)

    swapMethodCall(ast, "Deferred", "make", 2)
    swapMethodCall(ast, "Deferred", "makeAs", 2)
    swapMethodCall(ast, "Deferred", "unsafeMake", 2)

    if (expressionHasName(ast.value.callee, "Tag")) {
      expressionRename(ast.value.callee, "GenericTag")
    }
  })

  root
    .find(j.ImportDeclaration)
    .filter(_ => _.node.source.value === "effect/Context")
    .find(j.ImportSpecifier)
    .filter(_ => _.node.imported.name === "Tag")
    .replaceWith(j.importSpecifier(j.identifier("GenericTag")))

  return root.toSource()
}

//
// utilities
//

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

const swapSchema = (
  ast: cs.ASTPath<cs.TSTypeReference>,
  j: cs.API["jscodeshift"],
) => {
  if (hasName(ast, "Schema") && ast.value.typeParameters?.params.length === 3) {
    const params = ast.value.typeParameters.params
    params.reverse()
    popNever(params)
    if (
      params.length === 2
      && j(params[0]).toSource() === j(params[1]).toSource()
    ) {
      params.pop()
    }
  }
}

const swapFunctionCall = (
  ast: cs.ASTPath<cs.CallExpression>,
  name: string,
  size: number,
) => {
  if (
    ast.value.typeParameters?.params.length === size
    && expressionHasName(ast.value.callee, name)
  ) {
    ast.value.typeParameters.params.reverse()
    for (let i = 0; i < size - 1; i++) {
      popNever(ast.value.typeParameters.params)
    }
  }
}

const swapMethodCall = (
  ast: cs.ASTPath<cs.CallExpression>,
  object: string,
  name: string,
  size: number,
) => {
  if (
    ast.value.typeParameters?.params.length === size
    && expressionHasPropAccess(ast.value.callee, object, name)
  ) {
    ast.value.typeParameters.params.reverse()
    for (let i = 0; i < size - 1; i++) {
      popNever(ast.value.typeParameters.params)
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

const popDefaults = (size: number, defaults: ReadonlyArray<string>) => {
  const defaultDiff = size - defaults.length
  return (j: cs.API["jscodeshift"], params: Array<k.TSTypeKind>) => {
    for (let i = params.length; i > 0; i--) {
      const def = defaults[i - 1 - defaultDiff]
      const param = params[i - 1]
      if (j(param).toSource() === def) {
        params.pop()
      } else {
        break
      }
    }
  }
}

const popChannelDefaults = popDefaults(7, [
  "unknown",
  "never",
  "unknown",
  "void",
  "unknown",
  "never",
])
const swapChannel = (
  ast: cs.ASTPath<cs.TSTypeReference>,
  j: cs.API["jscodeshift"],
) => {
  if (
    hasName(ast, "Channel") && ast.value.typeParameters?.params.length === 7
  ) {
    const params = ast.value.typeParameters.params
    const newParams = [
      params[5],
      params[2],
      params[4],
      params[1],
      params[6],
      params[3],
      params[0],
    ]
    popChannelDefaults(j, newParams)
    ast.value.typeParameters.params = newParams
  }
}

const expressionHasName = (ast: k.ExpressionKind, name: string): boolean => {
  switch (ast.type) {
    case "Identifier": {
      return ast.name === name
    }
    case "MemberExpression": {
      return expressionHasName(ast.property, name)
    }
    default: {
      return false
    }
  }
}

const expressionHasPropAccess = (
  ast: k.ExpressionKind,
  object: string,
  prop: string,
): boolean =>
  ast.type === "MemberExpression"
  && ast.object.type === "Identifier" && ast.object.name === object
  && ast.property.type === "Identifier" && ast.property.name === prop

const expressionRename = (ast: k.ExpressionKind, name: string): void => {
  switch (ast.type) {
    case "Identifier": {
      ast.name = name
      return
    }
    case "MemberExpression": {
      return expressionRename(ast.property, name)
    }
    default: {
      return
    }
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

const fixTagIdentifier = (
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
      if (
        expressionHasName(callee, "Tag")
        && init.arguments.length === 0
        && declaration.id.type === "Identifier"
      ) {
        init.arguments.push(j.stringLiteral(`@services/${declaration.id.name}`))
      }
    }
  }
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
