# ChronVer

This repo contains the TypeScript implementation of the [Chronologic Versioning](https://chronver.org) specification, as well as a CLI. ChronVer is a temporal-based versioning system that makes version numbers more intuitive and easier to track. Welcome to the future.



## Features

- Full ChronVer specification implementation
- Command-line interface (CLI)
- Version validation and comparison
- Feature branch and breaking change support
- Deno and Node.js compatibility



## Installation

```sh
# deno
deno add jsr:@chronver/chronver

# node
npx jsr add @chronver/chronver
```



## Usage

### Basic Usage

```ts
// deno
import { ChronVer } from "jsr:@chronver/chronver";

// node
import { ChronVer } from "@chronver/chronver";

// create new version
const version = new ChronVer("2024.04.03.1");

// convert to string
console.log(version.toString()); // "2024.04.03.1"

// access version components
console.log(version.year);      // 2024
console.log(version.month);     // 4
console.log(version.day);       // 3
console.log(version.changeset); // 1
```

### Validation

```ts
console.log(ChronVer.isValid("2024.04.03")); // true
console.log(ChronVer.isValid("invalid"));    // false
console.log(ChronVer.isValid("2024.13.19")); // false (invalid month)
```

### Comparison

```ts
const v1 = "2024.04.03.1";
const v2 = "2024.04.03.2";

console.log(ChronVer.compare(v1, v2)); // -1 (v1 is older than v2)
console.log(ChronVer.compare(v2, v1)); // 1  (v2 is newer than v1)
console.log(ChronVer.compare(v1, v1)); // 0  (versions are equal)
```

### Feature Branches and Breaking Changes

```ts
// feature branch
const feature = new ChronVer("2024.04.03-feature");
console.log(feature.feature);    // "feature"
console.log(feature.toString()); // "2024.04.03-feature"

// breaking change
const breaking = new ChronVer("2024.04.03.1-break");
console.log(breaking.isBreaking); // true
console.log(breaking.toString()); // "2024.04.03.1-break"
```



## CLI Usage

```sh
# install CLI globally
deno install --allow-read --allow-env --global --name chronver cli.ts

# uninstall CLI globally
deno uninstall chronver --global
```

The ChronVer CLI provides several commands for working with chronological versions:

```sh
# get today's version
chronver today
chronver today --changeset=1 --feature=test
chronver today --breaking

# increment `version` in package.json
chronver -i package

# increment `version` in JSON file
chronver --increment file.json

# validate a version
chronver validate 2024.04.03.1
chronver validate 2024.04.03-feature

# compare versions
chronver compare 2024.04.03.1 2024.04.03.2
chronver is-newer 2024.04.03.2 2024.04.03.1

# parse version details
chronver parse 2024.04.03.1-break

# check for breaking changes
chronver is-breaking 2024.04.03.1-break

# show help
chronver help
```

### CLI Commands

- `compare <v1> <v2>` - Compare two versions
- `help` - Show help message
- `is-breaking <version>` - Check if version is a breaking change
- `is-newer <v1> <v2>` - Check if v1 is newer than v2
- `parse <version>` - Display detailed version information
- `today` - Generate today's version
- `validate <version>` - Check if a version string is valid
- `version` - Show CLI version

### CLI Options

- `--breaking` - Mark as breaking change
- `--changeset=<n>` - Specify changeset number
- `--feature=<name>` - Add feature name
- `--increment` - Increment version for the specified target (can be a JSON file path or any value)



## Version Format

A valid ChronVer version number follows this format:
- `YYYY.MM.DD[.CHANGESET][-LABEL]`

Where:
- `YYYY` is the four-digit year
- `MM` is the two-digit month (01-12)
- `DD` is the two-digit day (01-31)
- `CHANGESET` is an optional non-negative integer
- `LABEL` can be either "break" for breaking changes or a feature name

Examples:
- `2024.04.03`: basic version
- `2024.04.03.1`: version with changeset
- `2024.04.03-feature`: feature branch
- `2024.04.03.1-break`: breaking change



## API Reference

### `ChronVer` Class

#### Constructor

- `new ChronVer(version: string)`: creates a new ChronVer instance

#### Properties

- `changeset: number`: changeset number (0 if not specified)
- `day: number`: day component (1-31)
- `feature?: string`: feature name (if specified)
- `isBreaking: boolean`: whether this is a breaking change
- `month: number`: month component (1-12)
- `year: number`: year component

#### Methods

- `compare(other: ChronVer): number`: compares two versions (-1, 0, 1)
- `toString(): string`: converts version to its string representation

#### Static Methods

- `compare(v1: string, v2: string): number`: compares two version strings
- `increment(value: string | undefined): Promise<string>`: increments version
- `isValid(version: string): boolean`: checks if version string is valid
- `parseVersion(version: string): { changeset: number; date: string; version: string; } | null`: parses version



## Development

### Create executable

```sh
deno run --allow-env --allow-read --allow-run --allow-write bundle.ts
```

Now you can use `./bin/chronver.js` in your scripts.

### Running Tests

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



## License

MIT
