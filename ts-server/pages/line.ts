import express from "express";
import { Line, TransitNetwork } from "melbpt-utils";
import { Renderer } from "../serve-page";

export function getLineMatchingPath(network: TransitNetwork,
  path: string): Line | null {

  return network.lines.find(l => path == `/lines/${l.id.toFixed()}`) ?? null;
}

export function serveLine(res: express.Response, renderer: Renderer,
  network: TransitNetwork, line: Line) {

  const stops = line.allStops.map(stopID => {
    const stop = network.requireStop(stopID);

    return {
      id: stopID,
      name: stop.name,
      urlName: stop.urlName
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const data = {
    name: line.name,
    service: line.service,
    stops: stops,
    id: line.id
  };

  renderer.serve(res, "line", data);
}
