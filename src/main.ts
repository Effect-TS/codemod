#!/usr/bin/env node

import * as Args from "@effect/cli/Args"
import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/Runtime"
import * as Effect from "effect/Effect"
import * as jscodeshift from "jscodeshift/src/Runner"
import * as Fs from "node:fs"
import * as Path from "node:path"

const codemod = Args.choice<string>(
  Fs.readdirSync(`${__dirname}/codemods`).map(file => {
    const name = Path.basename(file, ".ts")
    return [name, name] as const
  }) as any,
  { name: "codemod" },
).pipe(
  Args.map(codemod => `${__dirname}/codemods/${codemod}.ts`),
  Args.withDescription("The code modification to run"),
)

const run = Command.make("codemod", {
  codemod,
  paths: Args.text({ name: "paths" }).pipe(
    Args.repeated,
    Args.withDescription("The paths to run the codemod on"),
  ),
  options: {
    dry: Options.boolean("dry-run").pipe(
      Options.withAlias("d"),
    ),
    print: Options.boolean("print").pipe(
      Options.withAlias("p"),
    ),
  },
}).pipe(
  Command.withHandler(({ codemod, options, paths }) =>
    Effect.promise(() =>
      jscodeshift.run(codemod, paths as Array<string>, {
        ...options,
        babel: true,
        parser: "ts",
        extensions: "ts,tsx",
      })
    )
  ),
  Command.run({
    name: "Effect Codemods",
    version: "0.0.0",
  }),
)

run(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  Effect.tapErrorCause(Effect.logError),
  runMain,
)
