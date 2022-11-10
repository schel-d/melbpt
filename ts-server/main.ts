import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { getNetwork, initNetwork } from "./network";
import { Renderer } from "./serve-page";
import { serveIndex } from "./pages";
import { serveAbout } from "./pages/about";
import { serveTrain } from "./pages/train";
import { serveSettings } from "./pages/settings";
import { serveLinesOverview } from "./pages/linesOverview";
import { getLineMatchingPath, serveLine } from "./pages/line";
import { getStopMatchingPath, serveStop } from "./pages/stop";

/** Paths reserved by pages on the site that cannot become stop pages. */
const reservedRoutes = [
  "/",
  "/about",
  "/css",
  "/departure",
  "/dev",
  "/disruption",
  "/go",
  "/home",
  "/html",
  "/icons",
  "/img",
  "/journey",
  "/js",
  "/lines",
  "/map",
  "/search",
  "/service",
  "/settings",
  "/train"
];

export async function main(offlineMode: boolean) {
  console.log("Starting...");

  const apiOrigin = offlineMode
    ? "http://localhost:3001"
    : "https://api.trainquery.com";
  console.log(`Using API origin: "${apiOrigin}"`);

  const app = express();
  const port = process.env.PORT ?? 3000;
  app.use(rateLimiter());
  app.use(compression());
  app.set("views", "./client/pug");
  app.set("view engine", "pug");
  app.use(express.static(".out/public"));

  try {
    await initNetwork(apiOrigin, reservedRoutes);
    const publicHashString = "";
    const renderer = new Renderer(apiOrigin, publicHashString);
    registerRoutes(app, renderer);
  }
  catch {
    // If the initial network information fails to load, we've got nothing to
    // work with, so spit out error 500 on all routes and wait for the dev to
    // notice. ¯\_(ツ)_/¯
    console.error("Failed to fetch initial network information.");
    app.all('*', (_req, res: express.Response) => {
      respondWithError(res, "500");
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
  });
}

function registerRoutes(app: express.Application, renderer: Renderer) {
  serveIndex(app, renderer);
  serveAbout(app, renderer);
  serveLinesOverview(app, renderer);
  serveSettings(app, renderer);
  serveTrain(app, renderer);

  // If the request is anything else, it might be one of the dynamic pages, or a
  // 404...
  app.all('*', (req: express.Request, res: express.Response) => {
    const network = getNetwork();

    // If it matches a line url, serve that line's page.
    const line = getLineMatchingPath(network, req.path);
    if (line != null) {
      serveLine(res, renderer, network, line);
      return;
    }

    // If it matches a stop url, serve that stop's page.
    const stop = getStopMatchingPath(network, req.path);
    if (stop != null) {
      serveStop(res, renderer, network, stop);
      return;
    }

    respondWithError(res, "404");
  });
}

function respondWithError(res: express.Response, type: "404" | "500" | "offline") {
  const response = {
    "404": () => res.status(404).render("error", {
      title: "Page not found",
      shortTitle: "Not found",
      description: "This page doesn't exist, at least not anymore!",
      showLinks: true,
      image: "404"
    }),
    "500": () => res.status(500).render("error", {
      title: "Internal server error",
      shortTitle: "Error",
      description: "Looks like I've got a bug to fix...",
      showLinks: false,
      image: "500"
    }),
    "offline": () => res.render("error", {
      title: "You're offline",
      shortTitle: "Offline",
      description: "You'll have to reconnect to the internet to use TrainQuery",
      showLinks: false,
      image: "offline"
    })
  };

  response[type]();
}

function rateLimiter() {
  // Allows up to 300 requests per minute from the same IP address.
  return rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  });
}
