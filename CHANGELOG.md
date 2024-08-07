# @effect/codemod

## 0.0.16

### Patch Changes

- [#39](https://github.com/Effect-TS/codemod/pull/39) [`183d054`](https://github.com/Effect-TS/codemod/commit/183d0541942406ad6d2c6959d2d7fb0ed1d05b47) Thanks @gcanti! - schema-0.69 codemod

- [#40](https://github.com/Effect-TS/codemod/pull/40) [`97a4978`](https://github.com/Effect-TS/codemod/commit/97a4978786930dfbe938bf5e6f00928dbfd8d452) Thanks @IMax153! - update to latest jscodeshift

## 0.0.15

### Patch Changes

- [#37](https://github.com/Effect-TS/codemod/pull/37) [`16a45d3`](https://github.com/Effect-TS/codemod/commit/16a45d303bbce1c659d7bb0cc8a91f09d8224f13) Thanks [@gcanti](https://github.com/gcanti)! - Fix: Update import from `formatError` to `formatErrorSync` in the schema 0.65 codemod, closes #36

## 0.0.14

### Patch Changes

- [#34](https://github.com/Effect-TS/codemod/pull/34) [`bfc890c`](https://github.com/Effect-TS/codemod/commit/bfc890c7b45837c566dc8de482fe1b0806c290e0) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add effect-3.0.4 mod to remove gen adapter

  NOTE: some edge cases are uncovered like:

  ```ts
  yield * $([Effect.succeed(0), Effect.succeed(1)] as const, Effect.allWith());
  ```

  that needs to be convered to:

  ```ts
  yield *
    pipe([Effect.succeed(0), Effect.succeed(1)] as const, Effect.allWith());
  ```

  Unfortunately not having type information in the mod tool renders impossible to decide if the `pipe` function is present or not.

## 0.0.13

### Patch Changes

- [#31](https://github.com/Effect-TS/codemod/pull/31) [`ce6e3c5`](https://github.com/Effect-TS/codemod/commit/ce6e3c51134bb110e31e85e0c0ec55f1ecda9115) Thanks [@tim-smart](https://github.com/tim-smart)! - remove use of "effect" in utils

## 0.0.12

### Patch Changes

- [#29](https://github.com/Effect-TS/codemod/pull/29) [`d2577cc`](https://github.com/Effect-TS/codemod/commit/d2577cc799635aee444c717cb9bf70b0db3a104a) Thanks [@tim-smart](https://github.com/tim-smart)! - move Utils to public directory

## 0.0.11

### Patch Changes

- [#27](https://github.com/Effect-TS/codemod/pull/27) [`712c2be`](https://github.com/Effect-TS/codemod/commit/712c2bef77d8d22419439c3dd5faa2b8f2214604) Thanks [@tim-smart](https://github.com/tim-smart)! - copy src to build output

## 0.0.10

### Patch Changes

- [#25](https://github.com/Effect-TS/codemod/pull/25) [`740d77e`](https://github.com/Effect-TS/codemod/commit/740d77e05879f7ada1c2b84d1987ce05277ebac2) Thanks [@gcanti](https://github.com/gcanti)! - add codemod for effect major 3.0

## 0.0.9

### Patch Changes

- [#23](https://github.com/Effect-TS/codemod/pull/23) [`88e32c0`](https://github.com/Effect-TS/codemod/commit/88e32c021af90815388ea32e00887e337fe2e5f2) Thanks [@gcanti](https://github.com/gcanti)! - update schema-0.65 codemod:

  - handle type-level Schema changes
  - handle LazyArbitrary type

## 0.0.8

### Patch Changes

- [#21](https://github.com/Effect-TS/codemod/pull/21) [`2154c5b`](https://github.com/Effect-TS/codemod/commit/2154c5b08429ff8d675d30ccfc2f13527fc007e9) Thanks [@gcanti](https://github.com/gcanti)! - add codemod for schema 0.65

## 0.0.7

### Patch Changes

- [#19](https://github.com/Effect-TS/codemod/pull/19) [`692f7f3`](https://github.com/Effect-TS/codemod/commit/692f7f3cdb21dc3353f2c667f22f48b62e072211) Thanks [@tim-smart](https://github.com/tim-smart)! - add codemod for platform 0.49

## 0.0.6

### Patch Changes

- [#17](https://github.com/Effect-TS/codemod/pull/17) [`ed9cf84`](https://github.com/Effect-TS/codemod/commit/ed9cf84147073c12318bc1df5fbe06aa188e5158) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add codemod to swap Schedule params

## 0.0.5

### Patch Changes

- [#14](https://github.com/Effect-TS/codemod/pull/14) [`e02e19a`](https://github.com/Effect-TS/codemod/commit/e02e19a99a46e5addd8a41a4aef17029f5e8d836) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add codemod for Either

- [#16](https://github.com/Effect-TS/codemod/pull/16) [`66dc95e`](https://github.com/Effect-TS/codemod/commit/66dc95e149ceb4b2dd03887faa91288309f8c902) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add codemod for minor 2.1, adding R to Schema as Schema<R, I, A>

## 0.0.4

### Patch Changes

- [#12](https://github.com/Effect-TS/codemod/pull/12) [`ee757b7`](https://github.com/Effect-TS/codemod/commit/ee757b76b0dc878480c4cd4382513948a4ca78a4) Thanks [@tim-smart](https://github.com/tim-smart)! - add Pool to minor 2.3

## 0.0.3

### Patch Changes

- [#8](https://github.com/Effect-TS/codemod/pull/8) [`e8af4eb`](https://github.com/Effect-TS/codemod/commit/e8af4eb0ced78d93ad9992c5c4e6c543f2886eff) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Fuse codemods, include tag renaming

- [#10](https://github.com/Effect-TS/codemod/pull/10) [`631d125`](https://github.com/Effect-TS/codemod/commit/631d12560f7f0786a1e23c32b669fcab590b7419) Thanks [@tim-smart](https://github.com/tim-smart)! - swap params for some common constructors

- [#7](https://github.com/Effect-TS/codemod/pull/7) [`0e1556c`](https://github.com/Effect-TS/codemod/commit/0e1556c37755574099e1efe0905ee532dfa5ce9c) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add codemod to turn async<a,b,c>() into async<c,b,a>() considering never as default

- [#11](https://github.com/Effect-TS/codemod/pull/11) [`3a42710`](https://github.com/Effect-TS/codemod/commit/3a42710f819f95382176d4ab4faf28e729f997f8) Thanks [@tim-smart](https://github.com/tim-smart)! - rename Tag imports to GenericTag

- [#4](https://github.com/Effect-TS/codemod/pull/4) [`b40d225`](https://github.com/Effect-TS/codemod/commit/b40d225b20eb67c418d20749d1d2d2bde5e802a3) Thanks [@tim-smart](https://github.com/tim-smart)! - add descriptions for dry-run and print

- [#9](https://github.com/Effect-TS/codemod/pull/9) [`66d50bb`](https://github.com/Effect-TS/codemod/commit/66d50bbc608501d91021b87425b3039f5fd19baf) Thanks [@tim-smart](https://github.com/tim-smart)! - add remaining data types to minor-2.3

- [#6](https://github.com/Effect-TS/codemod/pull/6) [`f861455`](https://github.com/Effect-TS/codemod/commit/f86145583a3a864287ff840e570d4576470006ab) Thanks [@tim-smart](https://github.com/tim-smart)! - only use cli built-in error logging

- [#3](https://github.com/Effect-TS/codemod/pull/3) [`0bc879b`](https://github.com/Effect-TS/codemod/commit/0bc879b8481b3d9dd5b9ace331a85aabb07cc02c) Thanks [@mikearnaldi](https://github.com/mikearnaldi)! - Add codemods for swap-type-params in Effect,Exit,STM,Stream,Layer,Schema and add-tag-identifier

- [#9](https://github.com/Effect-TS/codemod/pull/9) [`66d50bb`](https://github.com/Effect-TS/codemod/commit/66d50bbc608501d91021b87425b3039f5fd19baf) Thanks [@tim-smart](https://github.com/tim-smart)! - update /cli

## 0.0.2

### Patch Changes

- [`52b7ff8`](https://github.com/Effect-TS/codemod/commit/52b7ff8f90482068e4e9927d799583ea9d6c3e26) Thanks [@tim-smart](https://github.com/tim-smart)! - only log defects

## 0.0.1

### Patch Changes

- [`23c7ad6`](https://github.com/Effect-TS/codemod/commit/23c7ad66dfcaa229596da0e585474ef42bc7b846) Thanks [@tim-smart](https://github.com/tim-smart)! - initial release
