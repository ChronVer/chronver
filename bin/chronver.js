#!/usr/bin/env -S deno run

// https://jsr.io/@std/fmt/1.0.2/colors.ts
var { Deno: Deno2 } = globalThis;
var noColor = typeof Deno2?.noColor === "boolean" ? Deno2.noColor : false;
var enabled = !noColor;
function code(open, close) {
  return {
    open: `\x1B[${open.join(";")}m`,
    close: `\x1B[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
function run(str, code2) {
  return enabled ? `${code2.open}${str.replace(code2.regexp, code2.open)}${code2.close}` : str;
}
function bold(str) {
  return run(str, code([1], 22));
}
function red(str) {
  return run(str, code([31], 39));
}
function green(str) {
  return run(str, code([32], 39));
}
function blue(str) {
  return run(str, code([34], 39));
}
var ANSI_PATTERN = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
  ].join("|"),
  "g"
);

// https://jsr.io/@std/cli/1.0.6/parse_args.ts
var FLAG_REGEXP = /^(?:-(?:(?<doubleDash>-)(?<negated>no-)?)?)(?<key>.+?)(?:=(?<value>.+?))?$/s;
var LETTER_REGEXP = /[A-Za-z]/;
var NUMBER_REGEXP = /-?\d+(\.\d*)?(e-?\d+)?$/;
var HYPHEN_REGEXP = /^(-|--)[^-]/;
var VALUE_REGEXP = /=(?<value>.+)/;
var FLAG_NAME_REGEXP = /^--[^=]+$/;
var SPECIAL_CHAR_REGEXP = /\W/;
var NON_WHITESPACE_REGEXP = /\S/;
function isNumber(string) {
  return NON_WHITESPACE_REGEXP.test(string) && Number.isFinite(Number(string));
}
function setNested(object, keys, value, collect = false) {
  keys = [...keys];
  const key = keys.pop();
  keys.forEach((key2) => object = object[key2] ??= {});
  if (collect) {
    const v = object[key];
    if (Array.isArray(v)) {
      v.push(value);
      return;
    }
    value = v ? [v, value] : [value];
  }
  object[key] = value;
}
function hasNested(object, keys) {
  for (const key of keys) {
    const value = object[key];
    if (!Object.hasOwn(object, key))
      return false;
    object = value;
  }
  return true;
}
function aliasIsBoolean(aliasMap, booleanSet, key) {
  const set = aliasMap.get(key);
  if (set === void 0)
    return false;
  for (const alias of set)
    if (booleanSet.has(alias))
      return true;
  return false;
}
function isBooleanString(value) {
  return value === "true" || value === "false";
}
function parseBooleanString(value) {
  return value !== "false";
}
function parseArgs(args, options) {
  const {
    "--": doubleDash = false,
    alias = {},
    boolean = false,
    default: defaults = {},
    stopEarly = false,
    string = [],
    collect = [],
    negatable = [],
    unknown: unknownFn = (i) => i
  } = options ?? {};
  const aliasMap = /* @__PURE__ */ new Map();
  const booleanSet = /* @__PURE__ */ new Set();
  const stringSet = /* @__PURE__ */ new Set();
  const collectSet = /* @__PURE__ */ new Set();
  const negatableSet = /* @__PURE__ */ new Set();
  let allBools = false;
  if (alias) {
    for (const [key, value] of Object.entries(alias)) {
      if (value === void 0) {
        throw new TypeError("Alias value must be defined");
      }
      const aliases = Array.isArray(value) ? value : [value];
      aliasMap.set(key, new Set(aliases));
      aliases.forEach(
        (alias2) => aliasMap.set(
          alias2,
          /* @__PURE__ */ new Set([key, ...aliases.filter((it) => it !== alias2)])
        )
      );
    }
  }
  if (boolean) {
    if (typeof boolean === "boolean") {
      allBools = boolean;
    } else {
      const booleanArgs = Array.isArray(boolean) ? boolean : [boolean];
      for (const key of booleanArgs.filter(Boolean)) {
        booleanSet.add(key);
        aliasMap.get(key)?.forEach((al) => {
          booleanSet.add(al);
        });
      }
    }
  }
  if (string) {
    const stringArgs = Array.isArray(string) ? string : [string];
    for (const key of stringArgs.filter(Boolean)) {
      stringSet.add(key);
      aliasMap.get(key)?.forEach((al) => stringSet.add(al));
    }
  }
  if (collect) {
    const collectArgs = Array.isArray(collect) ? collect : [collect];
    for (const key of collectArgs.filter(Boolean)) {
      collectSet.add(key);
      aliasMap.get(key)?.forEach((al) => collectSet.add(al));
    }
  }
  if (negatable) {
    const negatableArgs = Array.isArray(negatable) ? negatable : [negatable];
    for (const key of negatableArgs.filter(Boolean)) {
      negatableSet.add(key);
      aliasMap.get(key)?.forEach((alias2) => negatableSet.add(alias2));
    }
  }
  const argv = { _: [] };
  function setArgument(key, value, arg, collect2) {
    if (!booleanSet.has(key) && !stringSet.has(key) && !aliasMap.has(key) && !(allBools && FLAG_NAME_REGEXP.test(arg)) && unknownFn?.(arg, key, value) === false) {
      return;
    }
    if (typeof value === "string" && !stringSet.has(key)) {
      value = isNumber(value) ? Number(value) : value;
    }
    const collectable = collect2 && collectSet.has(key);
    setNested(argv, key.split("."), value, collectable);
    aliasMap.get(key)?.forEach((key2) => {
      setNested(argv, key2.split("."), value, collectable);
    });
  }
  let notFlags = [];
  const index = args.indexOf("--");
  if (index !== -1) {
    notFlags = args.slice(index + 1);
    args = args.slice(0, index);
  }
  argsLoop:
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const groups = arg.match(FLAG_REGEXP)?.groups;
      if (groups) {
        const { doubleDash: doubleDash2, negated } = groups;
        let key = groups.key;
        let value = groups.value;
        if (doubleDash2) {
          if (value) {
            if (booleanSet.has(key))
              value = parseBooleanString(value);
            setArgument(key, value, arg, true);
            continue;
          }
          if (negated) {
            if (negatableSet.has(key)) {
              setArgument(key, false, arg, false);
              continue;
            }
            key = `no-${key}`;
          }
          const next = args[i + 1];
          if (next) {
            if (!booleanSet.has(key) && !allBools && !next.startsWith("-") && (!aliasMap.has(key) || !aliasIsBoolean(aliasMap, booleanSet, key))) {
              value = next;
              i++;
              setArgument(key, value, arg, true);
              continue;
            }
            if (isBooleanString(next)) {
              value = parseBooleanString(next);
              i++;
              setArgument(key, value, arg, true);
              continue;
            }
          }
          value = stringSet.has(key) ? "" : true;
          setArgument(key, value, arg, true);
          continue;
        }
        const letters = arg.slice(1, -1).split("");
        for (const [j, letter] of letters.entries()) {
          const next = arg.slice(j + 2);
          if (next === "-") {
            setArgument(letter, next, arg, true);
            continue;
          }
          if (LETTER_REGEXP.test(letter)) {
            const groups2 = VALUE_REGEXP.exec(next)?.groups;
            if (groups2) {
              setArgument(letter, groups2.value, arg, true);
              continue argsLoop;
            }
            if (NUMBER_REGEXP.test(next)) {
              setArgument(letter, next, arg, true);
              continue argsLoop;
            }
          }
          if (letters[j + 1]?.match(SPECIAL_CHAR_REGEXP)) {
            setArgument(letter, arg.slice(j + 2), arg, true);
            continue argsLoop;
          }
          setArgument(letter, stringSet.has(letter) ? "" : true, arg, true);
        }
        key = arg.slice(-1);
        if (key === "-")
          continue;
        const nextArg = args[i + 1];
        if (nextArg) {
          if (!HYPHEN_REGEXP.test(nextArg) && !booleanSet.has(key) && (!aliasMap.has(key) || !aliasIsBoolean(aliasMap, booleanSet, key))) {
            setArgument(key, nextArg, arg, true);
            i++;
            continue;
          }
          if (isBooleanString(nextArg)) {
            const value2 = parseBooleanString(nextArg);
            setArgument(key, value2, arg, true);
            i++;
            continue;
          }
        }
        setArgument(key, stringSet.has(key) ? "" : true, arg, true);
        continue;
      }
      if (unknownFn?.(arg) !== false) {
        argv._.push(
          stringSet.has("_") || !isNumber(arg) ? arg : Number(arg)
        );
      }
      if (stopEarly) {
        argv._.push(...args.slice(i + 1));
        break;
      }
    }
  for (const [key, value] of Object.entries(defaults)) {
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      setNested(argv, keys, value);
      aliasMap.get(key)?.forEach(
        (key2) => setNested(argv, key2.split("."), value)
      );
    }
  }
  for (const key of booleanSet.keys()) {
    const keys = key.split(".");
    if (!hasNested(argv, keys)) {
      const value = collectSet.has(key) ? [] : false;
      setNested(argv, keys, value);
    }
  }
  for (const key of stringSet.keys()) {
    const keys = key.split(".");
    if (!hasNested(argv, keys) && collectSet.has(key)) {
      setNested(argv, keys, []);
    }
  }
  if (doubleDash) {
    argv["--"] = notFlags;
  } else {
    argv._.push(...notFlags);
  }
  return argv;
}

// mod.ts
var ChronVer = class {
  /** Creates a new version */
  constructor(version) {
    if (!version) {
      const now = /* @__PURE__ */ new Date();
      this.changeset = 0;
      this.day = now.getDate();
      this.isBreaking = false;
      this.month = now.getMonth() + 1;
      this.year = now.getFullYear();
      this.validate();
      return this;
    }
    const regex = /^(\d{4})\.(?:0[1-9]|1[0-2])\.(?:0[1-9]|[12]\d|3[01])(?:\.(\d+))?(?:-(break|[a-zA-Z0-9-]+)(?:\.(\d+))?)?$/;
    const match = version.match(regex);
    if (!match)
      throw new Error("Invalid ChronVer format");
    const [, yearStr, changesetStr, label, featureChangeset] = match;
    const [monthStr, dayStr] = version.split(".").slice(1, 3);
    this.year = parseInt(yearStr);
    this.month = parseInt(monthStr);
    this.day = parseInt(dayStr);
    this.changeset = changesetStr ? parseInt(changesetStr) : 0;
    this.isBreaking = label === "break";
    if (label && !this.isBreaking) {
      this.feature = label;
      this.changeset = featureChangeset ? parseInt(featureChangeset) : 0;
    }
    this.validate();
  }
  /// methods
  /** Compares versions */
  compare(other) {
    const dateComparison = [
      this.year - other.year,
      this.month - other.month,
      this.day - other.day,
      this.changeset - other.changeset
    ].find((diff) => diff !== 0) || 0;
    if (dateComparison !== 0)
      return dateComparison;
    if (this.isBreaking !== other.isBreaking)
      return this.isBreaking ? 1 : -1;
    return 0;
  }
  /** Outputs a version in string format */
  toString() {
    const base = `${this.year}.${String(this.month).padStart(2, "0")}.${String(this.day).padStart(2, "0")}`;
    const changesetStr = this.changeset > 0 ? `.${this.changeset}` : "";
    const featureStr = this.feature ? `-${this.feature}` : "";
    const breakStr = this.isBreaking ? "-break" : "";
    return `${base}${changesetStr}${featureStr}${breakStr}`;
  }
  /// private method
  /** Validates version */
  validate() {
    if (this.year < 1)
      throw new Error("Year must be positive");
    if (this.month < 1 || this.month > 12)
      throw new Error("Month must be between 1 and 12");
    const maxDays = new Date(this.year, this.month, 0).getDate();
    if (this.day < 1 || this.day > maxDays)
      throw new Error(`Day must be between 1 and ${maxDays} for ${this.year}-${this.month}`);
    if (this.changeset < 0)
      throw new Error("Changeset must be non-negative");
  }
  /// static methods
  /**
   * Compare two ChronVers.
   *
   * Returns `0` if `version1` equals `version2`, or `1` if `version1` is greater, or
   * `-1` if `version2` is greater.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { compare } from "@chronver/chronver";
   *
   * const version1 = "2024.03.19";
   * const version2 = "2025.03.19";
   *
   * assertEquals(compare(version1, version2), -1);
   * assertEquals(compare(version2, version1), 1);
   * assertEquals(compare(version1, version1), 0);
   * ```
   *
   * @param version1 The first ChronVer to compare
   * @param version2 The second ChronVer to compare
   * @returns `1` if `version1` is greater, `0` if equal, or `-1` if `version2` is greater
   */
  static compare(v1, v2) {
    return new ChronVer(v1).compare(new ChronVer(v2));
  }
  /** Increments version */
  static async increment(value) {
    const today = /* @__PURE__ */ new Date();
    const currentDateStr = [
      today.getFullYear(),
      (today.getMonth() + 1).toString().padStart(2, "0"),
      today.getDate().toString().padStart(2, "0")
    ].join(".");
    if (!value)
      return new ChronVer().toString();
    if (value.endsWith(".json") || value === "package") {
      const filename = value === "package" ? "package.json" : value;
      try {
        const content = await Deno.readTextFile(filename);
        const json = JSON.parse(content);
        const currentVersion = this.parseVersion(json.version);
        if (currentVersion && currentVersion.date === currentDateStr) {
          json.version = [
            currentVersion.date,
            currentVersion.changeset + 1
          ].join(".");
        } else {
          json.version = new ChronVer().toString();
        }
        await Deno.writeTextFile(filename, JSON.stringify(json, null, 2) + "\n");
        return json.version;
      } catch (error) {
        throw new Error(`Failed to update ${filename}: ${error.message}`);
      }
    }
    return new ChronVer().toString();
  }
  /**
   * Returns true if the string can be parsed as ChronVer.
   *
   * @example Usage
   * ```ts
   * import { assert, assertFalse } from "@std/assert";
   * import { isValid } from "@chronver/chronver";
   *
   * assert(isValid("2024.04.03"));
   * assertFalse(isValid("invalid"));
   * ```
   *
   * @param version The version string to check
   * @returns `true` if the string can be parsed as ChronVer, `false` otherwise
   */
  static isValid(version) {
    try {
      new ChronVer(version);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Parses valid ChronVer.
   *
   * @example Usage
   * ```ts
   * import { parseVersion } from "@chronver/chronver";
   *
   * console.log(parseVersion("2024.04.03.4"));
   * ```
   *
   * @param version The version string to parse
   * @returns object with `changeset`, `date`, and `version`
   */
  static parseVersion(version) {
    const changesetMatch = version.match(/^(\d{4}\.\d{2}\.\d{2})\.(\d+)$/);
    if (changesetMatch) {
      return {
        changeset: parseInt(changesetMatch[2], 10),
        date: changesetMatch[1],
        version
      };
    } else {
      return {
        changeset: 0,
        date: version,
        version
      };
    }
  }
};

// cli.ts
var VERSION = "2024.11.19";
if (import.meta.main)
  main();
async function main() {
  const args = parseArgs(Deno.args, {
    alias: {
      h: "help",
      i: "increment",
      v: "version"
    },
    boolean: ["breaking", "help"],
    string: [
      "changeset",
      "feature",
      "increment"
    ]
  });
  const command = args._[0]?.toString();
  if (args.help || command === "help") {
    printHelp();
    return;
  }
  if (args.version || command === "version") {
    console.log(`ChronVer CLI version ${VERSION}`);
    return;
  }
  if (args.increment || command === "increment") {
    await ChronVer.increment(args.increment);
    return;
  }
  switch (command) {
    case "compare": {
      const v1 = args._[1]?.toString();
      const v2 = args._[2]?.toString();
      if (!v1 || !v2) {
        console.error(red("Error: Two version arguments required"));
        Deno.exit(1);
      }
      try {
        const result = ChronVer.compare(v1, v2);
        console.log(
          result === 0 ? "Versions are equal" : result < 0 ? `${v1} is older than ${v2}` : `${v1} is newer than ${v2}`
        );
      } catch (error) {
        console.error(red(`Error: ${error.message}`));
        Deno.exit(1);
      }
      break;
    }
    case "is-breaking": {
      const version = args._[1]?.toString();
      if (!version) {
        console.error(red("Error: Version argument required"));
        Deno.exit(1);
      }
      try {
        const v = new ChronVer(version);
        console.log(v.isBreaking ? green("Yes") : red("No"));
        Deno.exit(v.isBreaking ? 0 : 1);
      } catch (error) {
        console.error(red(`Error: ${error.message}`));
        Deno.exit(1);
      }
      break;
    }
    case "is-newer": {
      const v1 = args._[1]?.toString();
      const v2 = args._[2]?.toString();
      if (!v1 || !v2) {
        console.error(red("Error: Two version arguments required"));
        Deno.exit(1);
      }
      try {
        const result = ChronVer.compare(v1, v2) > 0;
        console.log(result ? green("Yes") : red("No"));
        Deno.exit(result ? 0 : 1);
      } catch (error) {
        console.error(red(`Error: ${error.message}`));
        Deno.exit(1);
      }
      break;
    }
    case "parse": {
      const version = args._[1]?.toString();
      if (!version) {
        console.error(red("Error: Version argument required"));
        Deno.exit(1);
      }
      parseAndDisplay(version);
      break;
    }
    case "today": {
      const version = generateToday(
        args.changeset !== void 0 ? parseInt(args.changeset) : void 0,
        args.feature,
        args.breaking
      );
      console.log(version);
      break;
    }
    case "validate": {
      const version = args._[1]?.toString();
      if (!version) {
        console.error(red("Error: Version argument required"));
        Deno.exit(1);
      }
      const isValid = ChronVer.isValid(version);
      console.log(isValid ? green("Valid") : red("Invalid"));
      Deno.exit(isValid ? 0 : 1);
      break;
    }
    default: {
      console.error(red("Error: Unknown command"));
      printHelp();
      Deno.exit(1);
    }
  }
}
function generateToday(changeset, feature, breaking = false) {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  let version = `${year}.${month}.${day}`;
  if (changeset !== void 0)
    version += `.${changeset}`;
  if (feature)
    version += `-${feature}`;
  if (breaking)
    version += "-break";
  return version;
}
function parseAndDisplay(version) {
  try {
    const v = new ChronVer(version);
    console.log(`
${bold("Version Details:")}
Year: ${blue(v.year.toString())}
Month: ${blue(v.month.toString().padStart(2, "0"))}
Day: ${blue(v.day.toString().padStart(2, "0"))}
Changeset: ${blue(v.changeset.toString())}
Feature: ${blue(v.feature || "none")}
Breaking: ${blue(v.isBreaking.toString())}
    `);
  } catch (error) {
    console.error(red(`Error: ${error.message}`));
    Deno.exit(1);
  }
}
function printHelp() {
  console.log(`
${bold("ChronVer CLI")} - Chronological versioning tools

${bold("USAGE:")}
  chronver <command> [options]

${bold("COMMANDS:")}
  compare <version1> <version2>   Compare two versions
  help                            Show this help message
  is-breaking <version>           Check if version is a breaking change
  is-newer <v1> <v2>              Check if v1 is newer than v2
  parse <version>                 Parse and display version details
  today [--changeset=<n>]         Generate today's version
  validate <version>              Validate a version string
  version                         Show CLI version

${bold("OPTIONS:")}
  --breaking                      Mark version as breaking change
  --changeset=<n>                 Specify changeset number for today's version
  --feature=<name>                Add feature name to version
  --increment                     Increment version for the specified target
                                  (can be a JSON file path or any value)

${bold("EXAMPLES:")}
  chronver validate 2024.04.03
  chronver compare 2024.04.03.1 2024.04.03.2
  chronver today --changeset=1 --feature=test
  chronver parse 2024.04.03.1-break
  chronver is-newer 2024.04.03.2 2024.04.03.1
  chronver -i package
  chronver --increment file.json
  `);
}
