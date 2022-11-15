import express from "express";
import { Line } from "melbpt-utils";
import { getNetwork } from "../network";
import { Renderer } from "../serve-page";

export function serveLinesOverview(app: express.Application, renderer: Renderer) {
  app.get("/lines", (_req: express.Request, res: express.Response) => {
    renderer.serve(res, "lines-overview", {
      lines: getOverviews(),
      ...getStopCounts()
    });
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

function getStopCounts() {
  let suburbanStopCount = 0;
  let suburbanExclusiveStopCount = 0;
  let regionalStopCount = 0;
  let regionalExclusiveStopCount = 0;

  getNetwork().stops.forEach(s => {
    const lines = getNetwork().linesThatStopAt(s.id);
    const suburban = lines.some(l => l.service == "suburban");
    const regional = lines.some(l => l.service == "regional");
    if (regional) {
      regionalStopCount++;
      if (!suburban) {
        regionalExclusiveStopCount++;
      }
    }
    if (suburban) {
      suburbanStopCount++;
      if (!regional) {
        suburbanExclusiveStopCount++;
      }
    }
  });

  return {
    stopCount: getNetwork().stops.length,
    suburbanLineCount: getNetwork().lines.filter(l => l.service == "suburban").length,
    regionalLineCount: getNetwork().lines.filter(l => l.service == "regional").length,
    suburbanStopCount: suburbanStopCount,
    suburbanExclusiveStopCount: suburbanExclusiveStopCount,
    regionalStopCount: regionalStopCount,
    regionalExclusiveStopCount: regionalExclusiveStopCount
  };
}
