
/// native

import { bold as shellBold, dim as shellDim, red as shellRed } from "std/fmt/colors.ts";
import { parse } from "std/flags/mod.ts";
import { writeAllSync } from "std/streams/conversion.ts";

/// util

import * as chronver from "./mod.ts";

// TODO
// : githook that prints ChronVer to a file before every commit (read from and overwritten)
//   : if file doesn't exist, create it
//   : if file has invalid version, overwrite it

// --version 2022.04.03 --increment (no value for default, or year/month/day/change)
// --version 000.0000.00 (calling version without flags automatically tests for validity)

if (import.meta.main) {
  const parsedArgs = parse(Deno.args);
  const parsedArgsArray = Object.keys(parsedArgs);
  let packageVersion = "";

  (async function() {
    const meta = await Deno.readTextFile("./version.txt");
    packageVersion = `cli version ${meta.trim()}`;

    if (!parsedArgsArray.length)
      return help();

    parsedArgsArray.forEach(argument => {
      const key = argument;
      const keyValue = parsedArgs[key];

      switch(key) {
        case "H":
        case "help":
          return help();

        case "I":
        case "inc":
        case "increment": {
          if (typeof keyValue === "boolean") {
            console.error(`${shellBold(shellRed("error"))}: Missing increment level`);
            return;
          }

          if (!["year", "month", "day", "change"].includes(keyValue)) {
            console.error(`${shellBold(shellRed("error"))}: Invalid increment level`);
            return;
          }

          if (!parsedArgs._[0]) {
            console.error(`${shellBold(shellRed("error"))}: Missing increment subject`);
            return;
          }

          return writeAllSync(
            Deno.stdout,
            new TextEncoder().encode(
              new chronver.ChronVer(String(parsedArgs._[0]), { increment: keyValue }).version
            )
          );
        }

        case "init":
        case "initialize": {
          return writeAllSync(
            Deno.stdout,
            new TextEncoder().encode(
              new chronver.ChronVer("0000.00.00", { initialize: true }).version
            )
          );
        }

        // case "V":
        // case "validate": {
        //   console.log(">>> validate");
        //   console.log(keyValue);
        //   break;
        // }

        default:
          return help();
      }
    });
  })();

  // deno-lint-ignore no-inner-declarations
  function help() {
    console.log([
      // "................................................................................", // 80 characters
      "       __",
      `      / /  ${packageVersion}`,
      " ____/ /  _______  ___ _  _____ ____",
      "/ __/ _ \\/ __/ _ \\/ _ \\ |/ / -_) __/",
      "\\__/_//_/_/  \\___/_//_/___/\\__/_/\n",
      "A TypeScript/Deno implementation of the <chronver.org> specification",
      "Copyright © netop://ウエハ (Paul Anthony Webb)\n",
      `${shellDim("Usage:")}`,
      "  chronver [flag] <version>\n",
      `${shellDim("Examples:")}`,
      "  deno run --allow-read cli.ts --initialize",
      "  deno run --allow-read cli.ts --increment month 2030.03.03\n",
      `${shellDim("Flags:")}`,
      "  -H, --help                          Show this help message.\n",
      "  -I, --inc,  --increment <level>     Increment a version by the specified level.",
      "                                      Must be followed by a version string.\n",
      "      --init, --initialize            Creates a ChronVer string, defaulting to",
      "                                      the present.\n",
      // "  -V,         --validate  <string>    Validates a supplied version.\n",
      `${shellDim("Levels:")}`,
      `  Can be one of: year, month, day, or change. Default level is "change". Only one`,
      "  level may be specified.\n",
      "  The version returned will always default to the present. However, supplied",
      "  versions with a future date will remain in the future.\n",
      `  For example, passing "1970.04.03 -I month" to ChronVer will return the present`,
      `  date but passing "3027.04.03 -I month" will return "3027.05.03".`
      // "................................................................................", // 80 characters
    ].join("\n"));
  }
}
