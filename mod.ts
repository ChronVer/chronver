


//// export

/**
 * The Chronologic Version parser.
 *
 * ```ts
 * import { ChronVer } from "jsr:@chronver/chronver";
 *
 * // create new version
 * const version = new ChronVer("2024.04.03.1");
 *
 * // convert to string
 * console.log(version.toString()); // "2024.04.03.1"
 *
 * // access version components
 * console.log(version.year);      // 2024
 * console.log(version.month);     // 4
 * console.log(version.day);       // 3
 * console.log(version.changeset); // 1
 * ```
 *
 * ### Validation
 *
 * ```ts
 * console.log(ChronVer.isValid("2024.04.03")); // true
 * console.log(ChronVer.isValid("invalid"));    // false
 * console.log(ChronVer.isValid("2024.13.19")); // false (invalid month)
 * ```
 *
 * ### Comparison
 *
 * ```ts
 * const v1 = "2024.04.03.1";
 * const v2 = "2024.04.03.2";
 *
 * console.log(ChronVer.compare(v1, v2)); // -1 (v1 is older than v2)
 * console.log(ChronVer.compare(v2, v1)); // 1  (v2 is newer than v1)
 * console.log(ChronVer.compare(v1, v1)); // 0  (versions are equal)
 * ```
 *
 * ### Feature Branches and Breaking Changes
 *
 * ```ts
 * // feature branch
 * const feature = new ChronVer("2024.04.03-feature");
 * console.log(feature.feature);    // "feature"
 * console.log(feature.toString()); // "2024.04.03-feature"
 *
 * // breaking change
 * const breaking = new ChronVer("2024.04.03.1-break");
 * console.log(breaking.isBreaking); // true
 * console.log(breaking.toString()); // "2024.04.03.1-break"
 * ```
 */
export class ChronVer {
  /** changeset number (0 if not specified) */
  readonly changeset: number;
  /** day component (1-31) */
  readonly day: number;
  /** feature name (if specified) */
  readonly feature?: string;
  /** whether this is a breaking change */
  readonly isBreaking: boolean;
  /** month component (1-12) */
  readonly month: number;
  /** year component */
  readonly year: number;

  /** Creates a new version */
  constructor(version: string) {
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
  compare(other: ChronVer): number {
    const dateComparison = [
      this.year - other.year,
      this.month - other.month,
      this.day - other.day,
      this.changeset - other.changeset
    ].find(diff => diff !== 0) || 0;

    if (dateComparison !== 0)
      return dateComparison;

    if (this.isBreaking !== other.isBreaking)
      return this.isBreaking ? 1 : -1; // breaking changes take precedence

    // feature versions are considered equal if dates match
    return 0;
  }

  /** Outputs a version in string format */
  toString(): string {
    const base = `${this.year}.${String(this.month).padStart(2, "0")}.${String(this.day).padStart(2, "0")}`;
    const changesetStr = this.changeset > 0 ? `.${this.changeset}` : "";
    const featureStr = this.feature ? `-${this.feature}` : "";
    const breakStr = this.isBreaking ? "-break" : "";

    return `${base}${changesetStr}${featureStr}${breakStr}`;
  }

  /// private method

  /** Validates version */
  private validate(): void {
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
   * Returns true if the string can be parsed as ChronVer.
   *
   * @example Usage
   * ```ts
   * import { assert, assertFalse } from "@std/assert";
   * import { isValid } from "@chronver/chronver";
   *
   * assert(canParse("2024.04.03"));
   * assertFalse(canParse("invalid"));
   * ```
   *
   * @param version The version string to check
   * @returns `true` if the string can be parsed as ChronVer, `false` otherwise
   */
  static isValid(version: string): boolean {
    try {
      new ChronVer(version);
      return true;
    } catch {
      return false;
    }
  }

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
  static compare(v1: string, v2: string): number {
    return new ChronVer(v1).compare(new ChronVer(v2));
  }
}
