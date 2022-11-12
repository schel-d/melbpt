import { CityLoopPortal, StopID } from "melbpt-utils";

export type LineGraphNode = RegularLineGraphNode | BranchLineGraphNode
  | CityLoopLineGraphNode;

export type NonCityLoopGraphNode = RegularLineGraphNode | BranchLineGraphNode;

/**
 * The data structure of what to draw in a line diagram for a particular line.
 */
export class LineGraph {
  /**
   * The first node in the graph. If in future a line might branch on both
   * ends (e.g. the metro tunnel line?) then it might need a special first node
   * type which can handle a branch in the backwards direction, but as of right
   * now, that's not necessary.
   */
  readonly first: LineGraphNode;

  /**
   * Creates a {@link LineGraph}.
   * @param first The first node in the graph.
   */
  constructor(first: LineGraphNode) {
    this.first = first;
  }
}

/**
 * A type of {@link LineGraphNode} for a single stop, with a single next one.
 */
export class RegularLineGraphNode {
  /** This stop's ID. */
  readonly stop: StopID;

  /** The node following this one, if any. */
  readonly next: NonCityLoopGraphNode | null;

  /**
   * Creates a {@link RegularLineGraphNode}.
   * @param stop The stop's ID.
   * @param next The node following this one, if any.
   */
  constructor(stop: StopID, next: NonCityLoopGraphNode | null) {
    this.stop = stop;
    this.next = next;
  }
}

/**
 * A type of {@link LineGraphNode} for a single stop, following which the line
 * then splits into two branches.
 */
export class BranchLineGraphNode {
  /** This stop's ID. */
  readonly stop: StopID;

  /** The node following this one in the first branch. */
  readonly branchA: NonCityLoopGraphNode;

  /** The node following this one in the second branch. */
  readonly branchB: NonCityLoopGraphNode;

  /**
   * Creates a {@link BranchLineGraphNode}.
   * @param stop This stop's ID.
   * @param branchA The first branch.
   * @param branchB The second branch.
   */
  constructor(stop: StopID, branchA: NonCityLoopGraphNode,
    branchB: NonCityLoopGraphNode) {

    this.stop = stop;
    this.branchA = branchA;
    this.branchB = branchB;
  }
}

/**
 * A type of {@link LineGraphNode} for the city loop. Must be the first node in
 * a {@link LineGraph}, and so is the only node not to inherit from
 * {@link NonCityLoopGraphNode}.
 */
export class CityLoopLineGraphNode {
  /** The city loop portal used, if any. */
  readonly portal: CityLoopPortal | null;

  /** The direction of travel around the loop to indicate, if any. */
  readonly direction: "clockwise" | "anticlockwise" | null;

  /** The node following this one, if any. */
  readonly next: NonCityLoopGraphNode | null;

  /**
   * Creates a {@link CityLoopLineGraphNode}.
   * @param portal The city loop portal used, if any.
   * @param direction The direction of travel around the loop to indicate, if
   * @param next The node following this one, if any.
   * any.
   */
  constructor(portal: CityLoopPortal | null,
    direction: "clockwise" | "anticlockwise" | null,
    next: NonCityLoopGraphNode | null) {

    this.portal = portal;
    this.direction = direction;
    this.next = next;
  }
}
