import express from "express";
import { Line, TransitNetwork } from "melbpt-utils";
import { Renderer } from "../serve-page";

export function getLineMatchingPath(network: TransitNetwork,
  path: string): Line | null {

  return network.lines.find(l => path == `/lines/${l.id.toFixed()}`) ?? null;
}

export function serveLine(res: express.Response, renderer: Renderer, line: Line) {
  const data = {
    name: line.name,
    service: line.service,
    id: line.id
  };

  renderer.serve(res, "line", data);
}
