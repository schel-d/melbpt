import {
  DirectionID, isDirectionID, isLineID, isLineService, isPlatformID, LineID,
  LineService, PlatformID, StopID, toDirectionID, toLineID, toLineService,
  toPlatformID, TransitNetwork
} from "melbpt-utils";
import { z } from "zod";

/** A method of filtering departures. */
export abstract class DepartureFilter {
  private readonly _value: string;

  /** Zod schema for parsing from JSON. */
  static json = z.string().transform(s => DepartureFilter.fromString(s));

  /** Zod schema for parsing from JSON but only using raw types. */
  static rawJson = z.string();

  /**
   * Creates a {@link DepartureFilter}.
   * @param value The filter value string.
   */
  constructor(value: string) {
    this._value = value;
  }

  /** Convert to JSON object according to {@link DepartureFilter.rawJson}. */
  toJSON(): z.infer<typeof DepartureFilter.rawJson> {
    return this.toString();
  }

  /** Convert to a string, e.g. "platform-2" or "all". */
  toString(): string {
    return this._value;
  }

  /**
   * Takes a string like "platform-2" or "all" and converts it to a filter.
   * Throws a {@link BadFilterError} if the filter is invalid.
   * @param value The filter string.
   */
  static fromString(value: string): DepartureFilter {
    const filter = DepartureFilter.fromStringOrNull(value);
    if (filter != null) { return filter; }
    throw BadFilterError.badFilter(value);
  }

  /** Returns false if this filter is impossible for this stop for any reason. */
  abstract isValid(network: TransitNetwork, stop: StopID): boolean;

  /**
   * Takes a string like "platform-2" or "all" and converts it to a filter.
   * Returns null if the filter is invalid.
   * @param value The filter string.
   */
  static fromStringOrNull(value: string): DepartureFilter | null {
    if (value == "all") { return new DepartureFilterAll(); }
    if (value == "up") { return new DepartureFilterUp(); }
    if (value == "down") { return new DepartureFilterDown(); }

    if (value.startsWith("direction-")) {
      const direction = value.substring("direction-".length);
      if (!isDirectionID(direction)) { return null; }
      return new DepartureFilterDirection(toDirectionID(direction));
    }

    if (value.startsWith("line-")) {
      const line = value.substring("line-".length);
      if (!isLineID(line)) { return null; }
      return new DepartureFilterLine(toLineID(line));
    }

    if (value.startsWith("platform-")) {
      const platform = value.substring("platform-".length);
      if (!isPlatformID(platform)) { return null; }
      return new DepartureFilterPlatform(toPlatformID(platform));
    }

    if (value.startsWith("service-")) {
      const service = value.substring("service-".length);
      if (!isLineService(service)) { return null; }
      return new DepartureFilterService(toLineService(service));
    }

    return null;
  }

  /** Returns true if the other filter has the same value as this one. */
  equals(other: DepartureFilter): boolean {
    return this.toString() == other.toString();
  }
}

/** Do not filter any departures. */
export class DepartureFilterAll extends DepartureFilter {
  /** Creates a {@link DepartureFilterAll}. */
  constructor() {
    super("all");
  }

  isValid(_network: TransitNetwork, _stop: StopID): boolean {
    // Any stop can filter by "all".
    return true;
  }
}

/** Filter that only allows departures in the up general direction. */
export class DepartureFilterUp extends DepartureFilter {
  /** Creates a {@link DepartureFilterUp}. */
  constructor() {
    super("up");
  }

  isValid(_network: TransitNetwork, _stop: StopID): boolean {
    // Any stop can filter by "up".
    return true;
  }
}

/** Filter that only allows departures in the down general direction. */
export class DepartureFilterDown extends DepartureFilter {
  /** Creates a {@link DepartureFilterDown}. */
  constructor() {
    super("down");
  }

  isValid(_network: TransitNetwork, _stop: StopID): boolean {
    // Any stop can filter by "down", even termini (for arrivals).
    return true;
  }
}

/**
 * Filter that only allows departures in an exact direction. Use
 * {@link DepartureFilterUp} or {@link DepartureFilterDown} for general
 * direction filter.
 */
export class DepartureFilterDirection extends DepartureFilter {
  /** The exact direction departures must match. */
  readonly direction: DirectionID;

  /**
   * Creates a {@link DepartureFilterDirection}.
   * @param direction The exact direction departures must match.
   */
  constructor(direction: DirectionID) {
    super(`direction-${direction}`);
    this.direction = direction;
  }

  isValid(_network: TransitNetwork, _stop: StopID): boolean {
    // This filter is unused. But even still, having a direction that doesn't
    // apply to this stop shouldn't break anything.
    return true;
  }
}

/** Filter that only allows departures on a particular line. */
export class DepartureFilterLine extends DepartureFilter {
  /** The line departures must match. */
  readonly line: LineID;

  /**
   * Creates a {@link DepartureFilterLine}.
   * @param line The line departures must match.
   */
  constructor(line: LineID) {
    super(`line-${line.toFixed()}`);
    this.line = line;
  }

  isValid(network: TransitNetwork, stop: StopID): boolean {
    // Check that this line runs through this stop (and exists at all).
    return network.linesThatStopAt(stop).some(l => l.id == this.line);
  }
}

/** Filter that only allows departures on a particular platform. */
export class DepartureFilterPlatform extends DepartureFilter {
  /** The platform departures must match. */
  readonly platform: PlatformID;

  /**
   * Creates a {@link DepartureFilterPlatform}.
   * @param platform The platform departures must match.
   */
  constructor(platform: PlatformID) {
    super(`platform-${platform}`);
    this.platform = platform;
  }

  isValid(network: TransitNetwork, stop: StopID): boolean {
    // Check that this stop has that platform.
    return network.requireStop(stop).getPlatform(this.platform) != null;
  }
}

/** Filter that only allows departures of a particular service type. */
export class DepartureFilterService extends DepartureFilter {
  /** The service type departures must match. */
  readonly service: LineService;

  /**
   * Creates a {@link DepartureFilterService}.
   * @param service The service type departures must match.
   */
  constructor(service: LineService) {
    super(`service-${service}`);
    this.service = service;
  }

  isValid(_network: TransitNetwork, _stop: StopID): boolean {
    // Having a service type that doesn't apply to this stop shouldn't break
    // anything.
    return true;
  }
}

/** A departure filter with an arrivals and set down only flag. */
export class FullDepartureFilter {
  /** The filter. */
  readonly filter: DepartureFilter;
  /** Whether to allow arrivals through the filter. */
  readonly arrivals: boolean;
  /** Whether to allow set down only departures through the filter. */
  readonly sdo: boolean;

  /**
   * Creates a {@link FullDepartureFilter}.
   * @param filter The filter.
   * @param arrivals Whether to allow arrivals through the filter.
   * @param sdo Whether to allow set down only departures through the filter.
   */
  constructor(filter: DepartureFilter, arrivals: boolean, sdo: boolean) {
    this.filter = filter;
    this.arrivals = arrivals;
    this.sdo = sdo;
  }
}

/**
 * The error object used when an API call is made that goes wrong.
 */
export class BadFilterError extends Error {
  /**
   * Creates a {@link BadFilterError}.
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "BadFilterError";
  }

  /** A filter with value "`value`" is invalid. */
  static badFilter(value: string): BadFilterError {
    return new BadFilterError(
      `A filter with value "${value}" is invalid`
    );
  }
}
