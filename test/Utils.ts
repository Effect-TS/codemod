import type cs from "jscodeshift"
import * as TestUtils from "jscodeshift/src/testUtils"

export const expectTransformation = (transformer: cs.Transform) =>
(
  description: string,
  input: string,
  output: string,
) => {
  TestUtils.defineInlineTest(
    { default: transformer, parser: "ts" },
    {},
    input,
    output,
    description,
  )
}
