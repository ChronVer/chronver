
/// native

import { assertEquals, assertThrows } from "std/testing/asserts.ts";

/// util

import * as chronver from "./mod.ts";

/// program

Deno.test("invalid versions", function () {
  const versions = [
    "0000.0.00",
    "0000.00.0",
    "000.000.0",
    "00.0000.0",
    "0.0000.00",
    "0.00.0000",
    "0.000.000",
    "0000.0.00",
    "000.0.000",
    "v0000.00.00"
  ];

  versions.forEach((version: string) => {
    assertThrows(
      function () {
        new chronver.ChronVer(version);
      },
      TypeError,
      `Invalid Version: ${version}`,
    );
  });
});

Deno.test("valid versions", function () {
  const { valid } = chronver;

  const versions = [
    "0000.00.00",
    "0000.00.00-3",
    "0000.00.00-foo",
    "1970.01.01",
    "1970.01.01.13",
    "1970.01.01.13-break",
    "1970.01.01.13-break.1",
    "1970.01.01.14-super-ui-enhance",
    "1970.01.01.14-super-ui-enhance.13",
    "1970.01.01.14-super-ui-please-work",
    "1970.01.01.14-super-ui-please-work.57",
    "1970.01.01-a.b.c.10.d.5",
    "1970.01.01-alpha.10.beta",
    "1970.01.01-alpha.10.beta+build.unicorn.rainbow",
    "1970.01.01-foo+bar",
    "1970.01.01-super-ui-enhance",
    "1970.01.01-super-ui-enhance.2",
    "1970.01.01-super-ui-please-work",
    "1970.01.01-super-ui-please-work.9",
    "1970.01.01+asdf"
  ];

  versions.forEach((version: string) => {
    assertEquals(valid(version), true);
  });
});
