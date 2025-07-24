
![](banner.png "ChronVer banner")

**[ChronVer](https://chronver.org) (Chronological Versioning) is calendar‑based versioning.** In the age of rapid software releases, knowing _when_ something released is more important than arbitrary numbers from an outdated versioning system that most people never adhere to anyway. Finally, versioning for the rest of us.



## Why ChronVer?

```
2025.07.21 ← You know exactly when this was released
v3.2.1     ← You have no idea when this happened
```

Semantic versioning is great for large systems like libraries and computers. Most software would benefit from **time‑based versioning** that's immediately understandable to everyone on a team, not just the technical‑minded.



## Format

```
YYYY.MM.DD[.CHANGESET][-FEATURE|-break]
```

### Examples

| Version                | Description                   |
|------------------------|-------------------------------|
| `2025.07.21`           | Released July 21st, 2025      |
| `2025.07.21.1`         | First hotfix that day         |
| `2025.07.21.3`         | Third change that day         |
| `2025.07.21-feature`   | Feature branch for that date  |
| `2025.07.21.1-feature` | Feature branch with changeset |
| `2025.07.21.1-break`   | Breaking change               |



## Installation

### Deno

```sh
# install
deno add jsr:@chronver/chronver

# import in your code
import { ChronVer } from "jsr:@chronver/chronver";

# install CLI globally
# "resolver diagnostics" will appear when using this method but it's fine
deno install --allow-read --allow-write --global --name chronver https://raw.githubusercontent.com/ChronVer/chronver/refs/heads/primary/cli.ts --import-map https://raw.githubusercontent.com/ChronVer/chronver/refs/heads/primary/deno.json
```

### npm/bun

```sh
# install via npm
npx jsr add @chronver/chronver

# install via bun
bunx jsr add @chronver/chronver

# import in your code
import { ChronVer } from "@chronver/chronver";
```

ChronVer is especially powerful with [husky](https://typicode.github.io/husky/). Here's how I use it in my Node projects (using [bun](https://bun.sh)):

```js
// package.json
  "devDependencies": {
    "del-cli": "^6.0.0",
    "husky": "^9.1.7"
  },
  "scripts": {
    "build": "bun run clean && vite build",
    "clean": "del './build'",
    "increment": "chronver increment",
    "pre-commit": "bun run build && bun run increment && git add -A :/",
    "prepare": "husky"
  }
```

Now every time you push a commit, the `version` in `package.json` gets updated. Please note that you'll need to install the `chronver` CLI globally using the Deno method above or the path method below (recommended).

### macOS/Linux

You can find releases of the CLI on the [releases page](https://github.com/ChronVer/chronver/releases) of this repo.

```sh
# create personal bin directory if it doesn't exist
mkdir -p ~/.local/bin

# add to PATH in your shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# move binary there
mv chronver ~/.local/bin/
```



## Usage

### Basic API

```ts
import { ChronVer } from "jsr:@chronver/chronver";

// create new version with today's date
const version = new ChronVer();
console.log(version.toString()); // "2025.07.21"

// parse existing version
const parsed = new ChronVer("2024.04.03.1");
console.log(parsed.year);      // 2024
console.log(parsed.month);     // 4
console.log(parsed.day);       // 3
console.log(parsed.changeset); // 1

// compare versions
const v1 = new ChronVer("2024.04.03");
const v2 = new ChronVer("2024.04.04");
console.log(v1.isOlderThan(v2)); // true
console.log(v2.isNewerThan(v1)); // true

// increment version
const incremented = version.increment();
console.log(incremented.toString()); // "2024.07.19.1" (if same day)
```

### Static Methods

```ts
// validation
ChronVer.isValid("2024.04.03"); // true
ChronVer.isValid("invalid");    // false

// comparison
ChronVer.compare("2024.04.03", "2024.04.04"); // -1

// parsing
const parsed = ChronVer.parseVersion("2024.04.03.1-feature");
// {
//   changeset: 1,
//   date: "2024.04.03",
//   feature: "feature",
//   isBreaking: false,
//   version: "2024.04.03.1-feature"
// }

// sorting
const versions = ["2024.04.05", "2024.04.03", "2024.04.04"];
ChronVer.sort(versions); // ["2024.04.03", "2024.04.04", "2024.04.05"]

// create from Date
const date = new Date(2024, 3, 3); // April 3, 2024
const version = ChronVer.fromDate(date, 5); // "2024.04.03.5"
```

### File Operations

```ts
// update package.json version
const newVersion = await ChronVer.incrementInFile("package.json");
console.log(newVersion); // "2025.07.21.1"

// works with any JSON file
await ChronVer.incrementInFile("deno.json");
```



## CLI Usage

```bash
# create new version
chronver create                            # 2024.07.19

# validate versions
chronver validate "2024.04.03.1"           # ✅ Valid: 2024.04.03.1

# compare versions
chronver compare "2024.04.03" "2024.04.04" # 2024.04.03 < 2024.04.04 (-1)

# increment package.json
chronver increment                         # 📦 Updated to: 2025.07.21.1
chronver increment deno.json               # 📦 Updated to: 2025.07.21.1

# parse version details
chronver parse "2024.04.03.1-feature"
# 📋 Version: 2024.04.03.1-feature
# 📅 Date: 2024.04.03
# 🔢 Changeset: 1
# 💥 Breaking: no
# 🚀 Feature: feature
# 📆 Day of week: Wednesday
# ⏪ Released 107 days ago

# sort versions
chronver sort "2024.04.03" "2024.04.01" "2024.04.05"
# 📊 Sorted (ascending):
# 🔼 1. 2024.04.01
# 🔼 2. 2024.04.03
# 🔼 3. 2024.04.05

chronver --sort-desc "2024.04.03" "2024.04.01" "2024.04.05"
# 📊 Sorted (descending):
# 🔽 1. 2024.04.05
# 🔽 2. 2024.04.03
# 🔽 3. 2024.04.01

# create from specific date
chronver format "2024-04-03" 5             # 2024.04.03.5

# help
chronver --help
```



## When to Use ChronVer

### ✅ Perfect For

- **SaaS platforms** with regular feature rollouts
- **Mobile apps** with app store schedules
- **Enterprise software** with quarterly releases
- **Security tools** where timing matters
- **Marketing‑driven releases** tied to campaigns
- **Compliance software** with regulatory deadlines

### ❌ Less Ideal For

- **Libraries** consumed by other developers
- **APIs** where breaking changes need clear signaling
- **Projects** with irregular, feature‑driven releases
- **Tools** where semantic compatibility matters more than timing



## Comparison with SemVer

| Aspect            | ChronVer                        | SemVer                    |
|-------------------|---------------------------------|---------------------------|
| **Clarity**       | Immediately shows when released | Requires lookup           |
| **Planning**      | Aligns with calendar schedules  | Feature‑driven            |
| **Communication** | "The April release"             | "Version 3.2.1"           |
| **Sorting**       | Chronological by default        | Arbitrary without context |
| **Compatibility** | Time‑based breaking changes     | API contract based        |
| **Best for**      | Time‑sensitive releases         | Library compatibility     |



## Advanced Features

### Feature Branches

```ts
const feature = new ChronVer("2024.04.03-new-ui");
console.log(feature.feature);    // "new-ui"
console.log(feature.toString()); // "2024.04.03-new-ui"
```

### Breaking Changes

```ts
const breaking = new ChronVer("2024.04.03.1-break");
console.log(breaking.isBreaking); // true
```

### Date Validation

ChronVer validates actual calendar dates:

```ts
ChronVer.isValid("2024.02.29"); // true (2024 was a leap year)
ChronVer.isValid("2023.02.29"); // false (2023 was not a leap year)
ChronVer.isValid("2024.04.31"); // false (April has 30 days)
```



## Real-World Examples

### `package.json` integration

```json
{
  "name": "my-app",
  "scripts": {
    "version": "chronver increment"
  },
  "version": "2025.07.21.3"
}
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Update version
  run: |
    chronver increment
    git add package.json
    git commit -m "chore: bump version to $(cat package.json | jq -r .version)"
```

### Release Notes

```md
## Release 2025.07.21 - Summer Feature Drop

### New Features

- Dark mode support
- Mobile‑responsive dashboard
- Advanced search filters

### Bug Fixes

- Fixed login timeout issue
- Improved performance on large datasets

### Breaking Changes

None in this release.
```



### Development

```sh
# clone project
git clone https://github.com/chronver/chronver.git && cd $_

# lint
deno check && deno lint

# run tests
deno test --allow-read --allow-write --fail-fast

# run CLI locally
deno run --allow-read --allow-write cli.ts --help
```

If you have [Just](https://just.systems/man/en/) installed:

```sh
just lint
# deno check && deno lint

just test
# deno test --allow-read --allow-write --fail-fast

just build
# compile CLI to an executable
```



## License

[Creative Commons ― CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)



## FAQ

### Why not just use dates?

ChronVer **is** dates, but with a structured format that supports multiple releases per day, feature branches, and breaking change indicators.

### What about semantic compatibility?

ChronVer can indicate breaking changes with the `-break` suffix. For situations where semantic versioning is **crucial**, stick with SemVer.

### How do I migrate from SemVer?

1. Choose your first ChronVer date (usually next release)
2. Update your build tools to use `chronver increment`
3. Update documentation to explain the new format
4. Consider keeping a mapping in your `CHANGELOG`

### Can I use both ChronVer and SemVer?

Absolutely! Here's how your project could use ChronVer for releases and SemVer for API versions:

```json
{
  "apiVersion": "v2.1.0",
  "version": "2024.07.19.1"
}
```
