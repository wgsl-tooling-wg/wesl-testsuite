# WESL Examples for Testing

This package contains wesl source texts useful
for tool builders to verify WESL parsing and linking.

## Test Format

The source texts are published as an array of objects
in both JSON and TypeScript format.
The format is described in:
[TestSchema.ts](./src/TestSchema.ts)

JSON version:
[importCases.json](./src/test-cases-json/importCases.json)
[importSyntaxCases.json](./src/test-cases-json/importSyntaxCases.json)
[conditionalTranslation.json](./src/test-cases-json/conditionalTranslation.json)

TypeScript version:
[ImportCases.ts](./src/test-cases/ImportCases.ts)
[ImportSyntaxCases.ts](./src/test-cases/ImportSyntaxCases.ts)
[ConditionalTranslation.ts](./src/test-cases/ConditionalTranslation.ts)

## Adding New Tests

Author new examples in TypeScript.
(TypeScript is similar to JSON but a little more user friendly for authoring.)

A tool is included in the package to convert the TypeScript objects to JSON.

### Convert TypeScript Tests to JSON


#### Install dependencies

```sh
pnpm install
```

#### Generate JSON test cases from TypeScript

```sh
pnpm build
```

#### Generate JSON test cases from TypeScript continuously

```sh
pnpm build:watch
```

## License

Except where noted (below and/or in individual files), all code in this repository is dual-licensed under either:

* MIT License ([LICENSE-MIT](LICENSE-MIT) or [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT))
* Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0))

at your option.

### Your contributions

Unless you explicitly state otherwise,
any contribution intentionally submitted for inclusion in the work by you,
as defined in the Apache-2.0 license,
shall be dual licensed as above,
without any additional terms or conditions.
