import express from "express";
import { Renderer } from "../serve-page";

export function serveAbout(app: express.Application, renderer: Renderer) {
  app.get("/about", (_req, res: express.Response) => {
    renderer.serve(res, "about");
  });
}
