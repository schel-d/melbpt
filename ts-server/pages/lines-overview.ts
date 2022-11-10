import express from "express";
import { Line } from "melbpt-utils";
import { getNetwork } from "../network";
import { Renderer } from "../serve-page";

export function serveLinesOverview(app: express.Application, renderer: Renderer) {
  app.get("/lines", (_req: express.Request, res: express.Response) => {
    renderer.serve(res, "lines", { lines: getOverviews() });
  });
}

function getOverviews() {
  const extractOverviewInfo = (l: Line) => {
    return {
      id: l.id,
      name: l.name,
      service: l.service,
      specialEventsOnly: l.specialEventsOnly
    };
  };

  return getNetwork().lines
    .map(l => extractOverviewInfo(l))
    .sort((a, b) => a.name.localeCompare(b.name));
}
