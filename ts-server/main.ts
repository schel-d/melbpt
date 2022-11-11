import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { getNetwork, initNetwork } from "./network";
import { Renderer } from "./serve-page";
import { serveIndex } from "./pages";
import { serveAbout } from "./pages/about";
import { serveTrain } from "./pages/train";
import { serveSettings } from "./pages/settings";
import { serveLinesOverview } from "./pages/lines-overview";
import { getLineMatchingPath, serveLine } from "./pages/line";
import { getStopMatchingPath, serveStop } from "./pages/stop";
import { reservedRoutes } from "./reserved-routes";
import { respondWithError } from "./error";

export async function main(offlineMode: boolean) {
  console.log("Starting...");

  const apiOrigin = offlineMode
    ? "http://localhost:3001"
    : "https://api.trainquery.com";
  console.log(`Using API origin: "${apiOrigin}"`);

  const publicHashString = "cache-" +
    (Math.floor(Math.random() * Math.pow(36, 8))).toString(36).padStart(8, "0");
  console.log(`Using public hash string: "${publicHashString}"`);

  const app = express();
  const port = process.env.PORT ?? 3002;
  app.use(caching(publicHashString));
  app.use(rateLimiter());
  app.use(compression());
  app.set("views", "./client/pug");
  app.set("view engine", "pug");

  app.use(express.static(".out/public"));
  app.use(`/${publicHashString}/`, express.static(".out/public-cachable"));


  try {
    await initNetwork(apiOrigin, reservedRoutes);
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

    // Otherwise it's a 404.
    respondWithError(res, "404");
  });
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

function caching(publicHashString: string) {
  return function (req: express.Request, res: express.Response,
    next: express.NextFunction) {

    // Cache for a year
    const cacheSeconds = 60 * 60 * 24 * 365;

    if (req.path.startsWith(`/${publicHashString}/`)) {
      res.set('Cache-control', `public, max-age=${cacheSeconds}`);
    }
    else {
      res.set('Cache-control', `no-store`);
    }

    next();
  };
}
