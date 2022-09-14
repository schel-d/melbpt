import express from "express";
import { Network, Stop } from "./network";

export function serveStop(res: express.Response, stop: Stop, network: Network,
  apiDomain: string) {

  const lines = network.lines
    .filter(l => l.directions.some(d => d.stops.includes(stop.id)))
    .map(l => {
      return {
        name: l.name, color: l.color, id: l.id,
        specialEventsOnly: l.specialEventsOnly
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  res.render("stop", {
    apiDomain: apiDomain, name: stop.name, id: stop.id, stopUrl: stop.urlName,
    lines: lines
  });
}
