


//// import

import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";



//// program

await esbuild.build({
  bundle: true,
  entryPoints: ["./cli.ts"],
  format: "esm",
  outfile: "./bin/chronver.js",
  plugins: [...denoPlugins()]
});
