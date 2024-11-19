


//// export

export class ChronVer {
  readonly changeset: number;
  readonly day: number;
  readonly feature?: string;
  readonly isBreaking: boolean;
  readonly month: number;
  readonly year: number;

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

  toString(): string {
    const base = `${this.year}.${String(this.month).padStart(2, "0")}.${String(this.day).padStart(2, "0")}`;
    const changesetStr = this.changeset > 0 ? `.${this.changeset}` : "";
    const featureStr = this.feature ? `-${this.feature}` : "";
    const breakStr = this.isBreaking ? "-break" : "";

    return `${base}${changesetStr}${featureStr}${breakStr}`;
  }

  /// private method

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

  static isValid(version: string): boolean {
    try {
      new ChronVer(version);
      return true;
    } catch {
      return false;
    }
  }

  static compare(v1: string, v2: string): number {
    return new ChronVer(v1).compare(new ChronVer(v2));
  }
}
