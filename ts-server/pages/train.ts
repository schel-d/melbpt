import express from "express";
import { Renderer } from "../serve-page";

export function serveTrain(app: express.Application, renderer: Renderer) {
  app.get("/train", (_req, res: express.Response) => {
    renderer.serve(res, "train");
  });
}
