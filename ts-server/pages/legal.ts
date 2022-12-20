import express from "express";
import { Renderer } from "../serve-page";

export function serveLegal(app: express.Application, renderer: Renderer) {
  app.get("/about/legal", (_req, res: express.Response) => {
    renderer.serve(res, "legal");
  });
}
