


//// import

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows
} from "@std/assert";

//// util

import { ChronVer, ChronVerError } from "./mod.ts";

const validVersions = [
  "2024.04.03",
  "2024.04.03.1",
  "2024.04.03.15",
  "2024.12.31.999",
  "2024.04.03-feature",
  "2024.04.03.1-feature",
  "2024.04.03-break",
  "2024.04.03.1-break",
  "2024.04.03-feature-name",
  "2024.04.03-feature.5"
];

const invalidVersions = [
  "invalid",
  "2024",
  "2024.4.3",
  "2024.04.32",
  "2024.13.15",
  "2024.00.15",
  "2024.04.00",
  "2024.04.03.-1",
  "2024.04.03.1.2",
  "24.04.03",
  "2024.4.03",
  "2024.04.3"
];



//// program

Deno.test("ChronVer constructor", async(test) => {
  await test.step("should create version with current date when no input", () => {
    const version = new ChronVer();
    const now = new Date();

    assertEquals(version.year, now.getFullYear());
    assertEquals(version.month, now.getMonth() + 1);
    assertEquals(version.day, now.getDate());
    assertEquals(version.changeset, 0);
    assertEquals(version.isBreaking, false);
  });

  await test.step("should parse valid version strings correctly", () => {
    const version = new ChronVer("2024.04.03.5");

    assertEquals(version.year, 2024);
    assertEquals(version.month, 4);
    assertEquals(version.day, 3);
    assertEquals(version.changeset, 5);
    assertEquals(version.isBreaking, false);
  });

  await test.step("should parse feature versions", () => {
    const version = new ChronVer("2024.04.03-feature");

    assertEquals(version.feature, "feature");
    assertEquals(version.changeset, 0);
    assertEquals(version.isBreaking, false);
  });

  await test.step("should parse feature versions with changeset", () => {
    const version = new ChronVer("2024.04.03-feature.5");

    assertEquals(version.feature, "feature");
    assertEquals(version.changeset, 5);
    assertEquals(version.isBreaking, false);
  });

  await test.step("should parse breaking versions", () => {
    const version = new ChronVer("2024.04.03.1-break");

    assertEquals(version.isBreaking, true);
    assertEquals(version.changeset, 1);
  });

  await test.step("should throw on invalid formats", () => {
    for (const invalid of invalidVersions) {
      assertThrows(() => new ChronVer(invalid), ChronVerError);
    }
  });
});

Deno.test("ChronVer validation", async(test) => {
  await test.step("should validate leap years correctly", () => {
    const leapYear = new ChronVer("2024.02.29");

    assertEquals(leapYear.day, 29);
    assertThrows(() => new ChronVer("2023.02.29"), ChronVerError);
  });

  await test.step("should validate month boundaries", () => {
    assertThrows(() => new ChronVer("2024.13.01"), ChronVerError);
    assertThrows(() => new ChronVer("2024.00.01"), ChronVerError);
  });

  await test.step("should validate day boundaries for different months", () => {
    assertThrows(() => new ChronVer("2024.02.30"), ChronVerError);
    assertThrows(() => new ChronVer("2024.04.31"), ChronVerError);
    assertThrows(() => new ChronVer("2024.01.32"), ChronVerError);
  });

  await test.step("should validate negative changesets", () => {
    assertThrows(() => new ChronVer("2024.04.03.-1"), ChronVerError);
  });
});

Deno.test("ChronVer comparison", async(test) => {
  await test.step("should compare dates correctly", () => {
    const v1 = new ChronVer("2024.04.03");
    const v2 = new ChronVer("2024.04.04");
    const v3 = new ChronVer("2024.05.03");
    const v4 = new ChronVer("2025.04.03");

    assertEquals(v1.compare(v2), -1);
    assertEquals(v2.compare(v1), 1);
    assertEquals(v1.compare(v3), -1);
    assertEquals(v1.compare(v4), -1);
    assertEquals(v1.compare(v1), 0);
  });

  await test.step("should compare changesets correctly", () => {
    const v1 = new ChronVer("2024.04.03.1");
    const v2 = new ChronVer("2024.04.03.2");

    assertEquals(v1.compare(v2), -1);
    assertEquals(v2.compare(v1), 1);
  });

  await test.step("should handle breaking changes in comparison", () => {
    const normal = new ChronVer("2024.04.03.1");
    const breaking = new ChronVer("2024.04.03.1-break");

    assertEquals(breaking.compare(normal), 1);
    assertEquals(normal.compare(breaking), -1);
  });

  await test.step("should treat feature versions as equal when dates match", () => {
    const v1 = new ChronVer("2024.04.03-feature1");
    const v2 = new ChronVer("2024.04.03-feature2");

    assertEquals(v1.compare(v2), 0);
  });
});

Deno.test("ChronVer utility methods", async(test) => {
  await test.step(`"isNewerThan" should work correctly`, () => {
    const v1 = new ChronVer("2024.04.03");
    const v2 = new ChronVer("2024.04.04");

    assert(v2.isNewerThan(v1));
    assertFalse(v1.isNewerThan(v2));
  });

  await test.step(`"isOlderThan" should work correctly`, () => {
    const v1 = new ChronVer("2024.04.03");
    const v2 = new ChronVer("2024.04.04");

    assert(v1.isOlderThan(v2));
    assertFalse(v2.isOlderThan(v1));
  });

  await test.step(`"equals" should work correctly`, () => {
    const v1 = new ChronVer("2024.04.03.1");
    const v2 = new ChronVer("2024.04.03.1");
    const v3 = new ChronVer("2024.04.03.2");

    assert(v1.equals(v2));
    assertFalse(v1.equals(v3));
  });

  await test.step(`"getDateString" should return correct format`, () => {
    const version = new ChronVer("2024.04.03.5");
    assertEquals(version.getDateString(), "2024.04.03");
  });
});

Deno.test("ChronVer string output", async(test) => {
  await test.step("should format basic versions correctly", () => {
    assertEquals(new ChronVer("2024.04.03").toString(), "2024.04.03");
    assertEquals(new ChronVer("2024.04.03.1").toString(), "2024.04.03.1");
  });

  await test.step("should format feature versions correctly", () => {
    assertEquals(new ChronVer("2024.04.03-feature").toString(), "2024.04.03-feature");
    assertEquals(new ChronVer("2024.04.03-feature.5").toString(), "2024.04.03.5-feature");
  });

  await test.step("should format breaking versions correctly", () => {
    assertEquals(new ChronVer("2024.04.03-break").toString(), "2024.04.03-break");
    assertEquals(new ChronVer("2024.04.03.1-break").toString(), "2024.04.03.1-break");
  });

  await test.step("should pad months and days correctly", () => {
    assertEquals(new ChronVer("2024.01.05").toString(), "2024.01.05");
    assertEquals(new ChronVer("2024.12.25").toString(), "2024.12.25");
  });
});

Deno.test("ChronVer increment", async(test) => {
  await test.step("should increment changeset for same day", () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`;
    const version = new ChronVer(todayStr + ".5");
    const incremented = version.increment();

    assertEquals(incremented.toString(), todayStr + ".6");
  });

  await test.step("should create new version for different day", () => {
    const version = new ChronVer("2023.01.01.5");
    const incremented = version.increment();
    const today = new Date();
    const expectedDate = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`;

    assertEquals(incremented.toString(), expectedDate);
  });
});

Deno.test("ChronVer static methods", async(test) => {
  await test.step(`"compare" should work with strings`, () => {
    assertEquals(ChronVer.compare("2024.04.03", "2024.04.04"), -1);
    assertEquals(ChronVer.compare("2024.04.04", "2024.04.03"), 1);
    assertEquals(ChronVer.compare("2024.04.03", "2024.04.03"), 0);
  });

  await test.step(`"isValid" should validate correctly`, () => {
    for (const valid of validVersions) {
      assert(ChronVer.isValid(valid));
    }

    for (const invalid of invalidVersions) {
      assertFalse(ChronVer.isValid(invalid));
    }
  });

  await test.step(`"parseVersion" should return correct structure`, () => {
    const parsed = ChronVer.parseVersion("2024.04.03.5-feature");

    assertEquals(parsed?.changeset, 5);
    assertEquals(parsed?.date, "2024.04.03");
    assertEquals(parsed?.version, "2024.04.03.5-feature");
    assertEquals(parsed?.isBreaking, false);
    assertEquals(parsed?.feature, "feature");
  });

  await test.step(`"parseVersion" should return null for invalid versions`, () => {
    assertEquals(ChronVer.parseVersion("invalid"), null);
  });

  await test.step(`"fromDate" should create version from Date object`, () => {
    const date = new Date(2024, 3, 3); /*** month is 0-indexed ***/
    const version = ChronVer.fromDate(date, 5);

    assertEquals(version.year, 2024);
    assertEquals(version.month, 4);
    assertEquals(version.day, 3);
    assertEquals(version.changeset, 5);
  });

  await test.step(`"sort" should order versions correctly`, () => {
    const versions = [
      "2024.04.05",
      "2024.04.03.1",
      "2024.04.03",
      "2024.04.04"
    ];

    const sorted = ChronVer.sort(versions);

    assertEquals(sorted, [
      "2024.04.03",
      "2024.04.03.1",
      "2024.04.04",
      "2024.04.05"
    ]);

    const sortedDesc = ChronVer.sort(versions, true);

    assertEquals(sortedDesc, [
      "2024.04.05",
      "2024.04.04",
      "2024.04.03.1",
      "2024.04.03"
    ]);
  });
});

Deno.test("ChronVer file operations", async(test) => {
  const testFile = "test-package.json";

  await test.step(`"incrementInFile" should create version if missing`, async() => {
    const testData = { name: "test-package" };
    await Deno.writeTextFile(testFile, JSON.stringify(testData));

    const newVersion = await ChronVer.incrementInFile(testFile);
    assert(ChronVer.isValid(newVersion));

    const content = await Deno.readTextFile(testFile);
    const json = JSON.parse(content);
    assertEquals(json.version, newVersion);

    await Deno.remove(testFile);
  });

  await test.step(`"incrementInFile" should increment existing version`, async() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getDate().toString().padStart(2, "0")}`;
    const testData = { name: "test-package", version: `${todayStr}.1` };

    await Deno.writeTextFile(testFile, JSON.stringify(testData));

    const newVersion = await ChronVer.incrementInFile(testFile);
    assertEquals(newVersion, `${todayStr}.2`);

    await Deno.remove(testFile);
  });

  await test.step(`"incrementInFile" should handle file not found`, async() => {
    try {
      await ChronVer.incrementInFile("nonexistent.json");
      assert(false, "Expected ChronVerError to be thrown");
    } catch(error) {
      assert(error instanceof ChronVerError, "Should throw ChronVerError");
      assert(error.message.includes("File not found"), "Should mention file not found");
    }
  });
});

Deno.test("ChronVer edge cases", async(test) => {
  await test.step("should handle year boundaries", () => {
    const version = new ChronVer("0001.01.01");

    assertEquals(version.year, 1);
    assertThrows(() => new ChronVer("0000.01.01"), ChronVerError);
  });

  await test.step("should handle complex feature names", () => {
    const version = new ChronVer("2024.04.03-feature-name-123");
    assertEquals(version.feature, "feature-name-123");
  });

  await test.step("should handle large changesets", () => {
    const version = new ChronVer("2024.04.03.999999");
    assertEquals(version.changeset, 999999);
  });

  await test.step(`"compare" should throw on invalid versions`, () => {
    assertThrows(() => ChronVer.compare("invalid", "2024.04.03"), ChronVerError);
  });
});
