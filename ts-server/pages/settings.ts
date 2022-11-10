import express from "express";
import { Renderer } from "../serve-page";

export function serveSettings(app: express.Application, renderer: Renderer) {
  app.get("/settings", (_req, res: express.Response) => {
    renderer.serve(res, "settings");
  });
}
