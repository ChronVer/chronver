# ChronVer

> [Chronologic Versioning](https://chronver.org "Official ChronVer website"), because we're in the future.



## Notes

- This module has some sharp corners and is not ready for primetime yet. You have been warned.

## Usage

```ts
import * as chronver from "https://deno.land/x/chronver/mod.ts";

chronver.valid("1.2.3");       // false
chronver.valid("v0000.00.00"); // false
chronver.valid("0000.00.00");  // true
chronver.valid("1970.01.01");  // true
chronver.valid("1970.01.01-alpha.10.beta+build.unicorn.rainbow");  // true
new chronver.ChronVer("0000.00.00", { initialize: true }).version; // "2022.09.26" (the current date in ChronVer format)
```

```sh
# WIP
deno run --allow-read cli.ts
```

## Versions

A "version" is described by the `2019.05.19` specification found at <https://chronver.org>.

## Test

You will need to first download [this repo](https://github.com/ChronVer/chronver "Github repository for ChronVer/chronver"), `cd` into it, and [install Deno](https://deno.land "A modern runtime for JavaScript and TypeScript") before proceeding further.

```sh
# lint all TypeScript files
deno lint

# type-check file
deno check cli.ts
deno check mod.ts
deno check test.ts

# run the tests in `test.ts`
deno test
```
