import express from "express";
import { Line, TransitNetwork } from "melbpt-utils";
import { getNetwork } from "../network";
import { Renderer } from "../serve-page";

export function getLineMatchingPath(network: TransitNetwork,
  path: string): Line | null {

  return network.lines.find(l => path == `/lines/${l.id.toFixed()}`) ?? null;
}

export function serveLine(res: express.Response, renderer: Renderer, line: Line) {
  const data = {
    name: line.name,
    service: line.service,
    id: line.id,
    stopCount: line.allStops.length,
    exclusiveStopCount: line.allStops
      .filter(s => getNetwork().linesThatStopAt(s).length == 1).length
  };

  renderer.serve(res, "line", data);
}
