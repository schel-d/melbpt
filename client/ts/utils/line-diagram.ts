import { LineColor, LineGraph, StopID, stopsToPortal } from "melbpt-utils";
import { domDiv } from "./dom-utils";

export type Builder =
  (stop: StopID, express: boolean, insetRem: number) => HTMLElement;

export function createLineDiagram(className: string, graph: LineGraph,
  builder: Builder, color: LineColor): HTMLDivElement {

  const $result = domDiv(`${className} accent-${color}`);

  if (graph.loop != null) {
    const $loop = domDiv("loop");
    const $stem = domDiv("loop-stem");
    $stem.style.left = `0.75rem`;
    $loop.append($stem);

    $loop.append(loopCapSvg(), loopJoinSvg());

    const stops = stopsToPortal(graph.loop.portal, true);
    stops.forEach((stop, i) => {
      const stemMode = i == stops.length - 1 ? "align" : "join";
      const $stop = createStopDiv(stop, "regular", true, stemMode, builder);
      $loop.append($stop);
    });

    $result.append($loop);
  }

  graph.stops.forEach((stop, i) => {
    const stopType = stop.isExpress ? "express" : "regular";
    const stemMode = i == graph.stops.length - 1 && graph.branches == null
      ? "hide" : "join";
    const $stop = createStopDiv(stop.id, stopType, false, stemMode, builder);
    $result.append($stop);
  });

  const branches = graph.branches;
  if (branches != null) {
    const $branch = domDiv("branch");
    const $stem = domDiv("branch-stem");
    $stem.style.left = `0.75rem`;
    $branch.append($stem);
    $branch.append(branchSplitSvg());

    branches.branchAStops.forEach((stop, i) => {
      const stopType = stop.isExpress ? "express" : "regular";
      const stemMode = i == branches.branchAStops.length - 1 ? "hide" : "join";
      const $stop = createStopDiv(stop.id, stopType, true, stemMode, builder);
      $branch.append($stop);
    });

    $result.append($branch);

    branches.branchBStops.forEach((stop, i) => {
      const stopType = stop.isExpress ? "express" : "regular";
      const stemMode = i == branches.branchBStops.length - 1 ? "hide" : "join";
      const $stop = createStopDiv(stop.id, stopType, false, stemMode, builder);
      $result.append($stop);
    });
  }

  return $result;
}

type StopType = "regular" | "express" | "major";
type StemMode = "join" | "align" | "hide";

export function createStopDiv(stop: StopID, stopType: StopType, inset: boolean,
  stemMode: StemMode, builder: Builder): HTMLDivElement {

  const $result = domDiv("stop");
  const insetRem = inset ? 1.5 : 0;

  if (stopType != "express") {
    const $notch = domDiv("notch");
    $notch.style.left = `${(0.75 + insetRem)}rem`;

    if (stopType == "major") { $notch.classList.add("major"); }
    $result.append($notch);
  }

  if (stemMode != "hide") {
    const $stem = domDiv("stem");
    $stem.style.left = `${(0.75 + insetRem)}rem`;

    if (stemMode == "join") { $stem.classList.add("join"); }
    $result.append($stem);
  }

  $result.append(builder(stop, stopType == "express", insetRem));
  return $result;
}

export function loopCapSvg(): SVGSVGElement {
  const $svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  $svg.classList.add("loop-cap");
  $svg.setAttribute("width", "48");
  $svg.setAttribute("height", "24");
  $svg.setAttribute("viewBox", "0 0 48 24");

  $svg.innerHTML = `<path
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="6.4"
    d="M 12 24 v -6 C 12 6, 36 6, 36 18 v 6"/>`;

  return $svg;
}

export function loopJoinSvg(): SVGSVGElement {
  const $svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  $svg.classList.add("loop-join");
  $svg.setAttribute("width", "48");
  $svg.setAttribute("height", "24");
  $svg.setAttribute("viewBox", "0 0 48 24");

  $svg.innerHTML = `<path
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="6.4"
    d="M 36 0 C 36 18, 12 12, 12 24"/>`;

  return $svg;
}

export function branchSplitSvg(): SVGSVGElement {
  const $svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  $svg.classList.add("branch-split");
  $svg.setAttribute("width", "48");
  $svg.setAttribute("height", "24");
  $svg.setAttribute("viewBox", "0 0 48 24");

  $svg.innerHTML = `<path
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="6.4"
    d="M 12 0 C 12 12, 36 6, 36 24"/>`;

  return $svg;
}
