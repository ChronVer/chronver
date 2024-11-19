


//// import

import { assertEquals, assertThrows } from "jsr:@std/assert";

//// util

import { ChronVer } from "./mod.ts";



//// program

Deno.test("ChronVer constructor validation", async(t) => {
  await t.step("should create valid versions", () => {
    const validVersions = [
      "2024.03.19",
      "2024.03.19.1",
      "2024.03.19-feature",
      "2024.03.19.1-break"
    ];

    validVersions.forEach(version => {
      new ChronVer(version);
    });
  });

  await t.step("should throw on invalid formats", () => {
    const invalidVersions = [
      "1.2.3",
      "2024.3.19",
      "2024.03.9",
      "02024.03.19",
      "2024.13.19",
      "2024.03.32",
      "2024.03.19.",
      "2024.03.19-",
      "abc.03.19",
      "2024.03.19.1.2"
    ];

    invalidVersions.forEach(version => {
      assertThrows(() => new ChronVer(version));
    });
  });

  await t.step("should validate leap years", () => {
    new ChronVer("2024.02.29"); // leap year
    assertThrows(() => new ChronVer("2023.02.29")); // non-leap year
  });
});

Deno.test("ChronVer toString", async(t) => {
  await t.step("should format version correctly", () => {
    const testCases = [
      ["2024.03.19", "2024.03.19"],
      ["2024.03.19.0", "2024.03.19"],
      ["2024.03.19.1", "2024.03.19.1"],
      ["2024.03.19-feature", "2024.03.19-feature"],
      ["2024.03.19.1-break", "2024.03.19.1-break"]
    ];

    testCases.forEach(([input, expected]) => {
      assertEquals(new ChronVer(input).toString(), expected);
    });
  });
});

Deno.test("ChronVer compare", async(t) => {
  await t.step("should compare versions correctly", () => {
    const comparisons = [
      ["2024.03.19", "2024.03.19", 0],
      ["2024.03.19", "2024.03.20", -1],
      ["2024.03.19", "2024.04.19", -1],
      ["2024.03.19", "2025.03.19", -1],
      ["2024.03.19.1", "2024.03.19.2", -1],
      ["2024.03.19.1", "2024.03.19.1", 0],
      ["2024.03.19.1-break", "2024.03.19.1", 1],
      ["2024.03.19-feature.1", "2024.03.19-other.1", 0]
    ];

    comparisons.forEach(([v1, v2, expected]) => {
      assertEquals(ChronVer.compare(v1 as string, v2 as string), expected);
    });
  });
});

Deno.test("ChronVer isValid", async(t) => {
  await t.step("should validate versions correctly", () => {
    const validVersions = [
      "2024.03.19",
      "2024.03.19.1",
      "2024.03.19-feature",
      "2024.03.19.1-break",
      "2024.03.19-feature.1"
    ];

    validVersions.forEach(version => {
      assertEquals(ChronVer.isValid(version), true);
    });

    const invalidVersions = [
      "1.2.3",
      "2024.3.19",
      "2024.13.19",
      "invalid"
    ];

    invalidVersions.forEach(version => {
      assertEquals(ChronVer.isValid(version), false);
    });
  });
});

Deno.test("ChronVer feature branches", async(t) => {
  await t.step("should handle feature branches correctly", () => {
    const version = new ChronVer("2024.03.19-feature.1");

    assertEquals(version.feature, "feature");
    assertEquals(version.changeset, 1);
    assertEquals(version.isBreaking, false);
  });

  await t.step("should handle breaking changes correctly", () => {
    const version = new ChronVer("2024.03.19.1-break");

    assertEquals(version.isBreaking, true);
    assertEquals(version.feature, undefined);
  });
});
