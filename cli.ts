#!/usr/bin/env -S deno run --allow-read --allow-write



//// import

import { parseArgs } from "@std/cli";

//// util

import { ChronVer } from "./mod.ts";

const VERSION = "2024.07.19.1";

interface CliArgs {
  _: string[];
  compare?: string[];
  create?: boolean;
  format?: string;
  help?: boolean;
  increment?: string;
  parse?: string;
  sort?: string[];
  "sort-desc"?: boolean;
  validate?: string;
  version?: boolean;
}



//// program

if (import.meta.main) {
  try {
    await main();
  } catch(error) {
    console.error(`❌ Unexpected error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    alias: { h: "help", v: "version" },
    boolean: ["help", "version", "create", "sort-desc"],
    collect: ["compare", "sort"],
    string: ["validate", "increment", "parse", "format"]
  }) as CliArgs;

  if (args.help) {
    showHelp();
    return;
  }

  if (args.version) {
    showVersion();
    return;
  }

  if (args.validate) {
    await validateVersion(args.validate);
    return;
  }

  if (args.compare && args.compare.length >= 2) {
    compareVersions(args.compare[0], args.compare[1]);
    return;
  }

  if (args.increment !== undefined) {
    await incrementVersion(args.increment || undefined);
    return;
  }

  if (args.create) {
    createVersion();
    return;
  }

  if (args.parse) {
    parseVersion(args.parse);
    return;
  }

  if (args.sort && args.sort.length > 0) {
    sortVersions(args.sort, false);
    return;
  }

  if (args["sort-desc"]) {
    const versions = args._.slice(0) as string[];

    if (versions.length > 0) {
      sortVersions(versions, args["sort-desc"]);
    } else {
      console.error("❌ Error: --sort-desc requires at least one version");
      Deno.exit(1);
    }

    return;
  }

  if (args.format) {
    const changeset = args._.length > 0 ? args._[0] as string : undefined;
    formatFromDate(args.format, changeset);
    return;
  }

  const command = args._[0] as string;

  switch(command) {
    case "compare": {
      if (args._[1] && args._[2]) {
        compareVersions(args._[1] as string, args._[2] as string);
      } else {
        console.error("❌ Error: compare command requires two version strings");
        Deno.exit(1);
      }

      break;
    }

    case "create": {
      createVersion();
      break;
    }

    case "format": {
      if (args._[1]) {
        const changeset = args._[2] as string;
        formatFromDate(args._[1] as string, changeset);
      } else {
        console.error("❌ Error: format command requires a date (YYYY-MM-DD)");
        Deno.exit(1);
      }

      break;
    }

    case "increment": {
      await incrementVersion(args._[1] as string);
      break;
    }

    case "parse": {
      if (args._[1]) {
        parseVersion(args._[1] as string);
      } else {
        console.error("❌ Error: parse command requires a version string");
        Deno.exit(1);
      }

      break;
    }

    case "sort": {
      if (args._.length > 1) {
        const versions = args._.slice(1) as string[];
        sortVersions(versions, false);
      } else {
        console.error("❌ Error: sort command requires at least one version");
        Deno.exit(1);
      }

      break;
    }

    case "validate": {
      if (args._[1]) {
        await validateVersion(args._[1] as string);
      } else {
        console.error("❌ Error: validate command requires a version string");
        Deno.exit(1);
      }

      break;
    }

    default: {
      if (command) {
        console.error(`❌ Unknown command: ${command}`);
        console.log("Run 'chronver --help' for usage information");
        Deno.exit(1);
      } else {
        console.log("ChronVer CLI - Versioning for the rest of us");
        console.log(`Run "chronver --help" for usage information`);
        console.log(`Run "chronver create" to generate a new version`);
      }
    }
  }
}



//// helper

function compareVersions(v1: string, v2: string): void {
  try {
    const result = ChronVer.compare(v1, v2);
    const symbol = result === -1 ?
      "<" :
      result === 1 ?
        ">" :
        "=";

    console.log(`${v1} ${symbol} ${v2} (${result})`);

    if (result === -1)
      console.log(`${v1} is older than ${v2}`);
    else if (result === 1)
      console.log(`${v1} is newer than ${v2}`);
    else
      console.log("Versions are equal");
  } catch(error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

function createVersion(): void {
  try {
    const version = new ChronVer();
    console.log(version.toString());
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

function formatFromDate(dateStr: string, changeset?: string): void {
  try {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match)
      throw new Error("Date must be in YYYY-MM-DD format");

    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const changesetNum = changeset ? parseInt(changeset) : 0;

    if (isNaN(changesetNum) || changesetNum < 0)
      throw new Error("Changeset must be a non-negative number");

    const version = ChronVer.fromDate(date, changesetNum);
    console.log(version.toString());
  } catch(error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

async function incrementVersion(filename?: string): Promise<void> {
  try {
    const file = filename || "package.json";
    console.log(`📦 Incrementing version in ${file}...`);

    const newVersion = await ChronVer.incrementInFile(file);
    console.log(`✅ Updated to: ${newVersion}`);
  } catch(error) {
    if ((error as Error).message.includes("No such file")) {
      console.error(`❌ File not found: ${filename || "package.json"}`);
      console.log("💡 Create the file first or specify a different file");
    } else {
      console.error(`❌ Error: ${(error as Error).message}`);
    }

    Deno.exit(1);
  }
}

function parseVersion(version: string): void {
  try {
    const parsed = ChronVer.parseVersion(version);

    if (!parsed) {
      console.log(`❌ Invalid version: ${version}`);
      Deno.exit(1);
    }

    console.log(`📋 Version: ${parsed.version}`);
    console.log(`📅 Date: ${parsed.date}`);
    console.log(`🔢 Changeset: ${parsed.changeset}`);
    console.log(`💥 Breaking: ${parsed.isBreaking ? "yes" : "no"}`);

    if (parsed.feature)
      console.log(`🚀 Feature: ${parsed.feature}`);

    const chronVer = new ChronVer(version);
    const date = new Date(chronVer.year, chronVer.month - 1, chronVer.day);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    console.log(`📆 Day of week: ${dayOfWeek}`);

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (date > now) {
      if (diffDays === 1)
        console.log("⏭️  Future release (in 1 day)");
      else
        console.log(`⏭️  Future release (in ${diffDays} days)`);
    } else if (diffDays === 0) {
      console.log(`🎯 Released today`);
    } else {
      if (diffDays === 1)
        console.log("⏪ Released 1 day ago");
      else
        console.log(`⏪ Released ${diffDays} days ago`);
    }
  } catch(error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

function showHelp(): void {
  console.log(`
ChronVer CLI ${VERSION}
Versioning for the rest of us

USAGE:
  chronver [OPTIONS] [COMMAND]

COMMANDS:
  compare <v1> <v2>          Compare two versions (-1, 0, 1)
  create                     Create a new version with today's date
  format <date> [changeset]  Create version from date (YYYY-MM-DD format)
  increment [file]           Increment version in package.json (or specified file)
  parse <version>            Parse and display version components
  sort <versions...>         Sort versions in ascending order
  validate <version>         Check if a version string is valid

OPTIONS:
  -h, --help                 Show this help message
  -v, --version              Show CLI version
  --sort-desc                Sort versions in descending order

EXAMPLES:
  chronver compare "2024.04.03" "2024.04.04"
  chronver create
  chronver format "2024-04-03" 5
  chronver increment
  chronver increment deno.json
  chronver parse "2024.04.03.1-feature"
  chronver sort "2024.04.03" "2024.04.01" "2024.04.05"
  chronver --sort-desc "2024.04.03" "2024.04.01" "2024.04.05"
  chronver validate "2024.04.03.1"

MORE INFO:
  ChronVer is calendar-based versioning: YYYY.MM.DD[.CHANGESET][-FEATURE|-break]

  Docs: https://chronver.org
  Repo: https://github.com/chronver/chronver
  `);
}

function showVersion(): void {
  console.log(`chronver ${VERSION}`);
}

function sortVersions(versions: string[], descending = false): void {
  try {
    const sorted = ChronVer.sort(versions, descending);
    const direction = descending ? "descending" : "ascending";

    console.log(`📊 Sorted (${direction}):`);

    console.log(versions);

    sorted.forEach((version, index) => {
      const prefix = descending ? "🔽" : "🔼";
      console.log(`${prefix} ${index + 1}. ${version}`);
    });
  } catch(error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

function validateVersion(version: string): void {
  try {
    const isValid = ChronVer.isValid(version);

    if (isValid) {
      console.log(`✅ Valid: ${version}`);
      const parsed = new ChronVer(version);
      console.log(`   Components: ${parsed.year}-${parsed.month.toString().padStart(2, "0")}-${parsed.day.toString().padStart(2, "0")}`);

      if (parsed.changeset > 0)
        console.log(`   Changeset: ${parsed.changeset}`);

      if (parsed.feature)
        console.log(`   Feature: ${parsed.feature}`);

      if (parsed.isBreaking)
        console.log(`   Breaking: yes`);
    } else {
      console.log(`❌ Invalid: ${version}`);
      Deno.exit(1);
    }
  } catch(error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}
