import { CityLoopPortal, StopID } from "melbpt-utils";

/** A possible direction around the city loop. */
export type CityLoopDirection = "clockwise" | "anticlockwise";

/**
 * The data structure of what to draw in a line diagram for a particular line.
 */
export class LineGraph {
  /**
   * The stops (after the loop but before the fork, if either are present) to
   * show on the diagram.
   */
  readonly stops: LineGraphStop[];

  /** Details about how to show the city loop, if at all. */
  readonly loop: LineGraphCityLoop | null;

  /** Details about how to show the branches on this line, if at all. */
  readonly branches: LineGraphBranches | null;

  /**
   * Creates a {@link LineGraph}.
   * @param stops The stops (after the loop but before the fork, if either are
   * present) to show on the diagram.
   * @param loop Details about how to show the city loop, if at all.
   * @param branches Details about how to show the branches on this line, if at
   * all.
   */
  constructor(stops: LineGraphStop[], loop: LineGraphCityLoop | null,
    branches: LineGraphBranches | null) {

    // If the line is linear, you need two stops.
    if (loop == null && branches == null && stops.length < 2) {
      throw BadLineGraphError.notEnoughStops();
    }

    // Otherwise you only need 1 stop (the loop or fork will contribute the
    // other stops, and if you have both you need at least 1 stop in-between).
    if (stops.length < 1) {
      throw BadLineGraphError.notEnoughStops();
    }

    // The origin cannot be express. If there's a city loop then it's not the
    // origin is it? So it's fine.
    if (loop == null && stops[0].isExpress) {
      throw BadLineGraphError.terminusOrOriginCannotBeExpress();
    }

    this.stops = stops;
    this.loop = loop;
    this.branches = branches;
  }
}

/**
 * The details about the city loop on this line diagram. At present, stops
 * within the loop section here cannot be shown as express. This is fine because
 * the line diagrams for actual services will draw their service as linear (for
 * now at least).
 */
export class LineGraphCityLoop {
  /** Which city loop portal this line uses. */
  readonly portal: CityLoopPortal;

  /** The usual running direction around the loop for this line, if any. */
  readonly direction: CityLoopDirection | null;

  /**
   * Creates a {@link LineGraphCityLoop}.
   * @param portal Which city loop portal this line uses.
   * @param direction The usual running direction around the loop for this line,
   * if any.
   */
  constructor(portal: CityLoopPortal, direction: CityLoopDirection | null) {
    this.portal = portal;
    this.direction = direction;
  }
}

/**
 * The details about the branches on this line.
 */
export class LineGraphBranches {
  /** The stops on the first branch. */
  readonly branchAStops: LineGraphStop[];

  /** The stops on the second branch. */
  readonly branchBStops: LineGraphStop[];

  /**
   * Creates a {@link LineGraphBranches}.
   * @param branchAStops The stops on the first branch.
   * @param branchBStops The stops on the second branch.
   */
  constructor(branchAStops: LineGraphStop[], branchBStops: LineGraphStop[]) {
    // Each branch must have one stop.
    if (branchAStops.length < 1 || branchBStops.length < 1) {
      throw BadLineGraphError.notEnoughStops();
    }

    // The termini cannot be express.
    const lastStopBranchA = branchAStops[branchAStops.length - 1];
    const lastStopBranchB = branchBStops[branchBStops.length - 1];
    if (lastStopBranchA.isExpress || lastStopBranchB.isExpress) {
      throw BadLineGraphError.terminusOrOriginCannotBeExpress();
    }

    this.branchAStops = branchAStops;
    this.branchBStops = branchBStops;
  }
}

/**
 * A stop in the {@link LineGraph}, with the option of showing it as express.
 */
export class LineGraphStop {
  readonly id: StopID;
  readonly isExpress: boolean;

  /**
   * Creates a {@link LineGraphStop}.
   * @param id The stop id.
   * @param isExpress Whether or not to show it as express.
   */
  constructor(id: StopID, isExpress: boolean) {
    this.id = id;
    this.isExpress = isExpress;
  }
}

/**
 * The error object used when an attempt is made to create an invalid
 * {@link LineGraph}.
 */
export class BadLineGraphError extends Error {
  /**
   * Creates a {@link BadEnumError}.
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "BadLineGraphError";
  }

  /**
   * The terminus or origin of a LineGraph cannot be express.
   */
  static terminusOrOriginCannotBeExpress(): BadLineGraphError {
    return new BadLineGraphError(
      `The terminus or origin of a LineGraph cannot be express`
    );
  }

  /**
   * Some section of the line graph has too few stops.
   */
  static notEnoughStops(): BadLineGraphError {
    return new BadLineGraphError(
      `Some section of the line graph has too few stops`
    );
  }
}
