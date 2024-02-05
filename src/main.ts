#!/usr/bin/env node

import * as Args from "@effect/cli/Args"
import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/Runtime"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as jscodeshift from "jscodeshift/src/Runner"
import assert from "node:assert"
import * as Fs from "node:fs"
import * as Path from "node:path"

const codemodFiles = Fs.readdirSync(`${__dirname}/codemods`)
assert(
  ReadonlyArray.isNonEmptyReadonlyArray(codemodFiles),
  "Could not find any code mod files",
)
const codemod = Args.choice(
  ReadonlyArray.map(
    codemodFiles,
    file => [
      Path.basename(file, ".ts"),
      Path.join(`${__dirname}/codemods`, file),
    ],
  ),
  { name: "codemod" },
).pipe(
  Args.withDescription("The code modification to run"),
)

const run = Command.make("codemod", {
  codemod,
  paths: Args.text({ name: "paths" }).pipe(
    Args.repeated,
    Args.map(ReadonlyArray.fromIterable), // TODO: Remove when `Args.repeated` returns Array
    Args.withDescription("The paths to run the codemod on"),
  ),
  options: {
    dry: Options.boolean("dry-run").pipe(
      Options.withAlias("d"),
      Options.withDescription("If set, the codemod will not modify any files"),
    ),
    print: Options.boolean("print").pipe(
      Options.withAlias("p"),
      Options.withDescription(
        "If set, the codemod will print the changes to the console",
      ),
    ),
  },
}).pipe(
  Command.withHandler(({ codemod, options, paths }) =>
    Effect.promise(() =>
      jscodeshift.run(codemod, paths, {
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
  Effect.tapDefect(Console.error),
  runMain,
)
