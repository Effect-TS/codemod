import * as FileSystem from "@effect/platform-node/FileSystem"
import { Effect, pipe } from "effect"
import * as path from "node:path"

const read = pipe(
  FileSystem.FileSystem,
  Effect.flatMap(fileSystem => fileSystem.readFileString("package.json")),
  Effect.map(_ => JSON.parse(_)),
  Effect.map(json => ({
    name: json.name,
    version: json.version,
    description: json.description,
    bin: "main.js",
    engines: json.engines,
    repository: json.repository,
    author: json.author,
    license: json.license,
    bugs: json.bugs,
    homepage: json.homepage,
    tags: json.tags,
    keywords: json.keywords,
    dependencies: json.dependencies,
  })),
)

const pathTo = path.join("dist", "package.json")

const write = (pkg: object) =>
  pipe(
    FileSystem.FileSystem,
    Effect.flatMap(fileSystem =>
      fileSystem.writeFileString(pathTo, JSON.stringify(pkg, null, 2))
    ),
  )

const program = pipe(
  Effect.sync(() => console.log(`copying package.json to ${pathTo}...`)),
  Effect.flatMap(() => read),
  Effect.flatMap(write),
  Effect.provide(FileSystem.layer),
)

Effect.runPromise(program)
