#!/usr/bin/env -S deno run



//// import

import { blue, bold, green, red } from "jsr:@std/fmt/colors";
import { parseArgs } from "jsr:@std/cli/parse-args";

//// util

import { ChronVer } from "./mod.ts";

const VERSION = "2024.11.19";



//// program

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

  switch(command) {
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
          result === 0 ?
            "Versions are equal" :
              result < 0 ?
                `${v1} is older than ${v2}` :
                `${v1} is newer than ${v2}`
        );
      } catch(error) {
        console.error(red(`Error: ${(error as Error).message}`));
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
      } catch(error) {
        console.error(red(`Error: ${(error as Error).message}`));
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
      } catch(error) {
        console.error(red(`Error: ${(error as Error).message}`));
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
        args.changeset !== undefined ? parseInt(args.changeset) : undefined,
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



//// helper

function generateToday(changeset?: number, feature?: string, breaking = false): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  let version = `${year}.${month}.${day}`;

  if (changeset !== undefined)
    version += `.${changeset}`;

  if (feature)
    version += `-${feature}`;

  if (breaking)
    version += "-break";

  return version;
}

function parseAndDisplay(version: string) {
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
  } catch(error) {
    console.error(red(`Error: ${(error as Error).message}`));
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
