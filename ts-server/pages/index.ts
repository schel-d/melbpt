import express from "express";
import { Renderer } from "../serve-page";

export function serveIndex(app: express.Application, renderer: Renderer) {
  app.get("/", (_req, res: express.Response) => {
    renderer.serve(res, "index");
  });
}
