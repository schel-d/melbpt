import { LineColor, StopID, stopsToPortal } from "melbpt-utils";
import { domDiv } from "../dom-utils";
import {
  CityLoopLineGraphNode, LineGraph, NonCityLoopGraphNode, RegularLineGraphNode
} from "./line-graph";

export type Builder = (stop: StopID, insetLevel: number) => HTMLDivElement;

export function createLineDiagram(className: string, graph: LineGraph,
  builder: Builder, color: LineColor): HTMLDivElement {

  const $result = domDiv(className);

  const $stopDivs = graph.first instanceof CityLoopLineGraphNode
    ? createStopDivsCityLoop(graph.first, 0, builder)
    : createStopDivs(graph.first, 0, builder);

  const $stopDivsContainer = domDiv(`stops accent-${color}`);
  $stopDivsContainer.append(...$stopDivs);
  $result.append($stopDivsContainer);

  return $result;
}

function createStopDivsCityLoop(node: CityLoopLineGraphNode, insetLevel: number,
  builder: Builder): HTMLDivElement[] {

  const $result: HTMLDivElement[] = [];

  // Use Jolimont and clockwise as defaults (for city-cirle services I guess).
  const stops = stopsToPortal(
    node.portal ?? "jolimont", node.direction != "anticlockwise"
  );

  $result.push(...stops.map(stop => {
    const $stopNotch = domDiv("stop-notch");
    $stopNotch.style.left = `${(0.75 + (insetLevel + 1) * 1.5)}rem`;

    const $detail = builder(stop, insetLevel + 1);

    const $stopDiv = domDiv("stop");
    $stopDiv.append($stopNotch, $detail);

    return $stopDiv;
  }));

  if (node.next != null) {
    $result.push(...createStopDivs(node.next, 0, builder));
  }

  return $result;
}

function createStopDivs(startNode: NonCityLoopGraphNode, insetLevel: number,
  builder: Builder): HTMLDivElement[] {

  const $result: HTMLDivElement[] = [];

  let currNode: NonCityLoopGraphNode | null = startNode;

  while (currNode != null) {
    const node: NonCityLoopGraphNode = currNode;
    if (node instanceof RegularLineGraphNode) {
      const $stopNotch = domDiv("stop-notch");
      $stopNotch.style.left = `${(0.75 + insetLevel * 1.5)}rem`;
      if (node.next == null) {
        $stopNotch.classList.add("terminus");
      }

      const $detail = builder(node.stop, insetLevel);

      const $stopDiv = domDiv("stop");
      $stopDiv.append($stopNotch, $detail);

      $result.push($stopDiv);
      currNode = node.next;
    }
    else {
      // Not a RegularLineGraphNode, so it must be a BranchLineGraphNode.
      const $stopNotch = domDiv("stop-notch");
      $stopNotch.style.left = `${(0.75 + insetLevel * 1.5)}rem`;

      const $detail = builder(node.stop, insetLevel);

      const $stopDiv = domDiv("stop");
      $stopDiv.append($stopNotch, $detail);

      $result.push($stopDiv);
      $result.push(...createStopDivs(node.branchB, insetLevel + 1, builder));
      currNode = node.branchA;
    }
  }

  return $result;
}
