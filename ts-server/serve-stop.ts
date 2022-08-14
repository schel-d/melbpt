import express from "express";
import { Stop } from "./network";

export function serveStop(res: express.Response, stop: Stop) {
  res.render("stop", { name: stop.name, id: stop.id });
}
