
/// util

const separatorRegex = /(\.|-|\||\+)/;

/// export

export const regex = /^(((\d{4})\.(\d{2})\.(\d{2})([.\-+][\d|\w]?.+))|((\d{4})\.(\d{2})\.(\d{2})(\.(\d{1,})))|((\d{4})\.(\d{2})\.(\d{2})))$/i;
export const specVersion = "2019.05.19";
export const valid = (version: string): boolean => regex.test(String(version));

export interface Options {
  coerce?: string;
  increment?: string;
  initialize?: boolean;
  parse?: string;
}

export interface Version {
  change: number | string;
  day: number;
  month: number;
  raw: string;
  version: string;
  year: number;
}

export class ChronVer {
  change!: number | string;
  day!: number;
  month!: number;
  raw!: string;
  version!: string;
  year!: number;

  /// helper parameters
  __extra?: string | null;
  __increment?: number | null;
  __original?: string;

  constructor(version: string | ChronVer, options?: Options) {
    if (version instanceof ChronVer)
      version = version.version;
    else if (typeof version !== "string")
      throw new TypeError(`Invalid Version: ${version}`);

    const match = version.trim().match(regex);

    if (!match)
      throw new TypeError(`Invalid Version: ${version}`);

    if (options) {
      const { increment, initialize } = options;

      if (initialize) {
        this.initialize();
        return this._returnThis();
      }

      if (increment) {
        this._coerce(version);
        this.increment(options.increment);

        return this._returnThis();
      }
    }

    if (version)
      this._parse(version);

    return this._returnThis();
  }

  _coerce(version: string) {
    const regexMatches = version.trim().split(".");

    switch(true) {
      /// ignore weird inputs
      case +regexMatches[0] <= 0:
      case +regexMatches[1] <= 0:
      case +regexMatches[2] <= 0: {
        return this.initialize();
      }

      default: {
        break;
      }
    }

    const versionYear = +regexMatches[0];
    const versionMonth = +regexMatches[1];
    const versionDay = +regexMatches[2];
    let i = 0;

    while (i < 3) {
      i++;
      regexMatches.shift();
    }

    const versionFinal = regexMatches.length ?
      `${versionYear}.${this.processMonth(versionMonth)}.${this.processDay(versionDay).day}.${regexMatches.join(".")}` :
      `${versionYear}.${this.processMonth(versionMonth)}.${this.processDay(versionDay).day}`;

    this.__extra = regexMatches.length ?
      regexMatches.join(".") :
      null;

    this.change = 0;
    this.day = versionDay;
    this.month = versionMonth;
    this.raw = versionFinal;
    this.version = versionFinal;
    this.year = versionYear;

    return this;
  }

  _format() {
    const { change } = this.processChange(this.change);

    switch(true) {
      case this.year <= 1970:
      case this.month <= 0:
      case this.day <= 0:
      case isNaN(this.year):
      case isNaN(this.month):
      case isNaN(this.day): {
        return this._coerce(`${this.year}.${this.month}.${this.day}`);
      }

      default: {
        this.version =
          this.year + "." +
          this.processMonth(this.month) + "." +
          this.processDay(this.day).day +
          // this.__extra !== (null || undefined) ?
          //   `.${this.__extra}` :
          //   "" +
          (Number(change) > 0 ? `.${change}` : "");

        this.raw = this.version;
        return this;
      }
    }
  }

  _parse(version: string | Version | null): ChronVer | null {
    if (!version)
      return null;

    if (version instanceof ChronVer)
      return version;

    const regexMatches = typeof version === "string" ?
      version.trim().split(".") :
      version.version.trim().split(".");
    const { day, extra } = this.processDay(regexMatches[2]);

    this.__extra = extra;
    this.year = +regexMatches[0];
    this.month = +regexMatches[1];
    this.day = +day;
    this.raw = regexMatches.join(".");
    this.version = regexMatches.join(".");

    switch(true) {
      case isNaN(this.year):
      case isNaN(this.month):
      case isNaN(this.day):
      case String(this.year).length < 4: {
        return null;
      }

      default: {
        break;
      }
    }

    /// first three matches are verified
    /// let's look at the rest of the version
    for (let step = 0; step < 3; step++)
      regexMatches.shift();

    if (regexMatches.length > 0) {
      const { change, toIncrement } = this.processChange(regexMatches.join("."));

      this.change = change;
      this.__increment = toIncrement;
    } else {
      this.change = 0;
    }

    return this;
  }

  _returnThis() {
    delete this.__extra;
    delete this.__increment;
    delete this.__original;

    return orderObject(this);
  }

  increment(incrementType?: string) {
    let versionChange = null;
    let versionIncrement = null;

    if (incrementType && incrementType === "change") {
      const { change, toIncrement } = this.processChange(this.version);

      versionChange = change;
      versionIncrement = toIncrement;

      if (String(change).match(/\./g))
        incrementType = "day"; // we are most likely incrementing a date
    }

    if (this.change)
      versionChange = this.change;

    if (this.__increment)
      versionIncrement = this.__increment;

    switch(incrementType) {
      case "day": {
        if (versionIncrement)
          this.day = versionIncrement + 1;
        else
          this.day++;

        this._format();
        break;
      }

      case "month": {
        if (versionIncrement)
          this.month = versionIncrement + 1;
        else
          this.month++;

        break;
      }

      case "year": {
        if (versionIncrement)
          this.year = versionIncrement + 1;
        else
          this.year++;

        break;
      }

      case "change":
      default: {
        if (versionChange && versionIncrement) {
          this.raw = [
            String(versionChange).length > 0 ?
              versionChange :
              "",
            Number(versionIncrement) ?
              versionIncrement + 1 :
              ""
          ].join("");

          this.version = this.raw;
        } else if (Number(this.change)) {
          this.change = Number(this.change) + 1;
        }

        break;
      }
    }

    this.raw = this.version;

    if (Number(this.change))
      this.change = Number(this.change);

    // this._format();
    return this;
  }

  initialize() {
    const versionYear = +new Date().getFullYear();
    const versionMonth = +new Date().getMonth() + 1;
    const versionDay = +new Date().getDate();
    const version = `${versionYear}.${this.processMonth(versionMonth)}.${this.processDay(versionDay).day}`;

    this.change = 0;
    this.day = versionDay;
    this.month = versionMonth;
    this.raw = version;
    this.version = version;
    this.year = versionYear;

    return this;
  }

  processChange(change: number | string): { change: number | string; toIncrement: number | null; } {
    const toIncrement = null;

    if (Number(change)) {
      if (change === 0) {
        return {
          change,
          toIncrement
        };
      } else {
        return {
          change: String(change).length > 0 ? change : 0,
          toIncrement
        };
      }
    }

    const changesetIdentifier = String(change).split(separatorRegex);
    const lastElement = changesetIdentifier.slice(-1)[0];
    const changesetIdentifierSansLastElement = removeItemOnce(changesetIdentifier, (changesetIdentifier.length - 1));

    function removeItemOnce(arr: Array<unknown>, value: number) {
      const index = value;

      if (index > -1)
        arr.splice(index, 1);

      return arr.join("");
    }

    if (changesetIdentifier.length > 0) {
      if (Number(lastElement)) {
        return {
          change: changesetIdentifierSansLastElement,
          toIncrement: Number(lastElement)
        };
      } else {
        return {
          change: changesetIdentifierSansLastElement + lastElement,
          toIncrement
        };
      }
    }

    return {
      change: 0,
      toIncrement
    };
  }

  processDay(day: number | string): { day: number | string; extra: string; } {
    if (Number(day)) {
      if (+day === 0)
        day = 1;

      return {
        day: String(day).length > 1 ? day : `0${day}`,
        extra: ""
      };
    } else {
      const arrayWithDay = String(day).split(separatorRegex);
      const theDay = arrayWithDay[0];
      const arraySansDay = arrayWithDay.filter(arrayItem => arrayItem !== theDay).join("");

      return {
        day: theDay,
        extra: arraySansDay
      };
    }
  }

  processMonth(month: number): number | string {
    if (+month === 0)
      month = 1;

    return String(month).length > 1 ?
      month :
      `0${month}`;
  }
}

/// helper

// deno-lint-ignore no-explicit-any
function orderObject(maybeObject?: any): any {
  if (!maybeObject || maybeObject instanceof Array || typeof maybeObject !== "object")
    return maybeObject;

  /// https://stackoverflow.com/a/56833507
  // deno-lint-ignore no-explicit-any
  const definitelyObject: { [index: string]: any } = maybeObject;
  const sortedKeys = Object.keys(definitelyObject).sort();

  /// https://gist.github.com/aleph-naught2tog/938dd20dfc53e91da952569fd5655e2d
  return sortedKeys.reduce((objectSoFar, currentKey) => {
    const currentValue = definitelyObject[currentKey];
    const maybeSortedValue = orderObject(currentValue);

    return Object.setPrototypeOf({
      ...objectSoFar,
      [currentKey]: maybeSortedValue === null ? 0 : maybeSortedValue
    }, Object.getPrototypeOf(definitelyObject));
  }, {});
}
