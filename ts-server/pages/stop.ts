import express from "express";
import { Stop, TransitNetwork } from "melbpt-utils";
import { Renderer } from "../serve-page";

export function getStopMatchingPath(network: TransitNetwork,
  path: string): Stop | null {

  return network.stops.find(l => path == `/${l.urlName}`) ?? null;
}

export function serveStop(res: express.Response, renderer: Renderer,
  network: TransitNetwork, stop: Stop) {

  const lines = network.lines
    .filter(l => l.allStops.includes(stop.id))
    .map(l => {
      return {
        name: l.name,
        color: l.color,
        id: l.id,
        specialEventsOnly: l.specialEventsOnly
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const data = {
    name: stop.name,
    id: stop.id,
    stopUrl: stop.urlName,
    lines: lines
  };

  renderer.serve(res, "stop", data);
}
