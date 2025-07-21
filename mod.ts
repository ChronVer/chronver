


//// export

export class ChronVer {
  private static readonly DATE_REGEX = /^(\d{4})\.(\d{2})\.(\d{2})$/;
  private static readonly VERSION_REGEX = /^(\d{4})\.(?:0[1-9]|1[0-2])\.(?:0[1-9]|[12]\d|3[01])(?:\.(\d+))?(?:-(break|[a-zA-Z0-9-]+)(?:\.(\d+))?)?$/;

  readonly changeset: number;   /*** changeset number (0 if not specified) ***/
  readonly day: number;         /*** day component (1-31) ***/
  readonly feature?: string;    /*** feature name (if specified) ***/
  readonly isBreaking: boolean; /*** whether this is a breaking change ***/
  readonly month: number;       /*** month component (1-12) ***/
  readonly year: number;        /*** year component ***/

  constructor(version?: string) {
    if (!version) {
      const now = new Date();

      this.changeset = 0;
      this.day = now.getDate();
      this.isBreaking = false;
      this.month = now.getMonth() + 1;
      this.year = now.getFullYear();

      return;
    }

    const parsed = this.parseVersionString(version);

    this.changeset = parsed.changeset;
    this.day = parsed.day;
    this.feature = parsed.feature;
    this.isBreaking = parsed.isBreaking;
    this.month = parsed.month;
    this.year = parsed.year;

    this.validate();
  }

  //// private methods

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private parseVersionString(version: string): { changeset: number; day: number; feature?: string; isBreaking: boolean; month: number; year: number; } {
    const match = version.match(ChronVer.VERSION_REGEX);

    if (!match)
      throw new ChronVerError(`Invalid ChronVer format: "${version}"`);

    const [, yearStr, changesetStr, label, featureChangeset] = match;
    const parts = version.split(".");

    if (parts.length < 3)
      throw new ChronVerError(`Invalid ChronVer format: "${version}"`);

    const year = parseInt(yearStr, 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const isBreaking = label === "break";

    let changeset = changesetStr ?
      parseInt(changesetStr, 10) :
      0;

    let feature: string | undefined;

    if (label && !isBreaking) {
      feature = label;

      if (!changeset) {
        changeset = featureChangeset ?
          parseInt(featureChangeset, 10) :
          0;
      }
    }

    return {
      changeset,
      day,
      feature,
      isBreaking,
      month,
      year
    };
  }

  private validate(): void {
    if (this.year < 1)
      throw new ChronVerError("Year must be positive");

    if (this.month < 1 || this.month > 12)
      throw new ChronVerError("Month must be between 1 and 12");

    const maxDays = this.getDaysInMonth(this.year, this.month);

    if (this.day < 1 || this.day > maxDays)
      throw new ChronVerError(`Day must be between 1 and ${maxDays} for ${this.year}-${this.month.toString().padStart(2, "0")}`);

    if (this.changeset < 0)
      throw new ChronVerError("Changeset cannot be negative");

    if (this.feature && !/^[a-zA-Z0-9-]+$/.test(this.feature))
      throw new ChronVerError("Feature name must contain only alphanumeric characters and hyphens");
  }

  //// public methods

  compare(other: ChronVer): number {
    /*** compare date components ***/
    const comparisons = [
      this.year - other.year,
      this.month - other.month,
      this.day - other.day,
      this.changeset - other.changeset
    ];

    for (const diff of comparisons) {
      if (diff !== 0)
        return Math.sign(diff);
    }

    if (this.isBreaking !== other.isBreaking)
      return this.isBreaking ? 1 : -1; /*** compare breaking changes ***/

    /*** at this point, changeset is zero ***/
    return 0;
  }

  equals(other: ChronVer): boolean {
    return this.compare(other) === 0;
  }

  getDateString(): string {
    return `${this.year}.${this.month.toString().padStart(2, "0")}.${this.day.toString().padStart(2, "0")}`;
  }

  increment(): ChronVer {
    const today = new Date();

    const isToday = this.year === today.getFullYear() &&
      this.month === (today.getMonth() + 1) &&
      this.day === today.getDate();

    if (isToday) /*** already ran today, increment changeset ***/
      return new ChronVer(`${this.year}.${this.month.toString().padStart(2, "0")}.${this.day.toString().padStart(2, "0")}.${this.changeset + 1}`);

    return new ChronVer();
  }

  isNewerThan(other: ChronVer): boolean {
    return this.compare(other) > 0;
  }

  isOlderThan(other: ChronVer): boolean {
    return this.compare(other) < 0;
  }

  toString(): string {
    const base = `${this.year}.${this.month.toString().padStart(2, "0")}.${this.day.toString().padStart(2, "0")}`;
    let result = base;

    if (this.changeset > 0)
      result += `.${this.changeset}`;

    if (this.feature)
      result += `-${this.feature}`;

    if (this.isBreaking)
      result += "-break";

    return result;
  }

  //// static methods

  static compare(v1: string, v2: string): number {
    try {
      const version1 = new ChronVer(v1);
      const version2 = new ChronVer(v2);

      return version1.compare(version2);
    } catch(error) {
      throw new ChronVerError(`Failed to compare versions: ${(error as Error).message}`);
    }
  }

  static fromDate(date: Date, changeset: number = 0): ChronVer {
    const dateStr = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getDate().toString().padStart(2, "0")}`;
    return new ChronVer(changeset > 0 ? `${dateStr}.${changeset}` : dateStr);
  }

  static async incrementInFile(filename: string = "package.json"): Promise<string> {
    try {
      const content = await Deno.readTextFile(filename);
      const json = JSON.parse(content);

      if (!json.version) {
        json.version = new ChronVer().toString();
      } else {
        const currentVersion = new ChronVer(json.version);
        json.version = currentVersion.increment().toString();
      }

      await Deno.writeTextFile(filename, JSON.stringify(json, null, 2) + "\n");
      return json.version;
    } catch(error) {
      if ( /*** not found errors ***/
        error instanceof Deno.errors.NotFound ||
        (error as Error).message.includes("No such file") ||
        (error as Error).message.includes("ENOENT") ||
        (error as Error).message.includes("not found"))
        throw new ChronVerError(`File not found: ${filename}`);

      if (error instanceof SyntaxError) /*** json parsing errors ***/
        throw new ChronVerError(`Invalid JSON in ${filename}: ${(error as Error).message}`);

      if ((error as Error).message.includes("permission") || (error as Error).message.includes("EACCES"))
        throw new ChronVerError(`Permission denied accessing ${filename}`); /*** permission errors ***/

      throw new ChronVerError(`Failed to update ${filename}: ${(error as Error).message}`);
    }
  }

  static isValid(version: string): boolean {
    try {
      new ChronVer(version);
      return true;
    } catch {
      return false;
    }
  }

  static parseVersion(version: string): { changeset: number; date: string; feature?: string; isBreaking: boolean; version: string; } | null {
    if (!this.isValid(version))
      return null;

    try {
      const chronVer = new ChronVer(version);

      return {
        changeset: chronVer.changeset,
        date: chronVer.getDateString(),
        feature: chronVer.feature,
        isBreaking: chronVer.isBreaking,
        version
      };
    } catch {
      return null;
    }
  }

  static sort(versions: string[], descending: boolean = false): string[] {
    return versions.slice().sort((a, b) => {
      const result = ChronVer.compare(a, b);
      return descending ? -result : result;
    });
  }
}

export class ChronVerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChronVerError";
  }
}
