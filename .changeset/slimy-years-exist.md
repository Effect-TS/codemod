---
"@effect/codemod": patch
---

Add effect-3.0.4 mod to remove gen adapter

NOTE: some edge cases are uncovered like:

```ts
yield* $([Effect.succeed(0), Effect.succeed(1)] as const, Effect.allWith())
```

that needs to be convered to:

```ts
yield* pipe([Effect.succeed(0), Effect.succeed(1)] as const, Effect.allWith())
```

Unfortunately not having type information in the mod tool renders impossible to decide if the `pipe` function is present or not.
