import express from "express";
import compression from "compression";
import { fetchNetwork, Network } from "./network";
import { serveStop } from "./serve-stop";

/**
 * How often (in milliseconds) to re-download the network data from the api.
 * Currently set to the value of every 10 minutes.
 */
const dataRefreshIntervalMs = 10 * 60 * 1000;

const reservedRoutes = [
  "/",
  "/about",
  "/css",
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

let network: Network | null = null;

export async function main() {
  console.log("Starting...");

  const app = express();
  const port = process.env.PORT ?? 3000;

  app.use(compression());

  app.set("views", "./client/pug");
  app.set("view engine", "pug");
  app.use(express.static(".out/public"));

  try {
    setupNetwork(await fetchNetwork());
    registerRoutes(app);
  }
  catch {
    console.error("Failed to fetch initial network information.");

    app.all('*', (_req, res: express.Response) => {
      res.sendStatus(500);
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
  });
}

function registerRoutes(app: express.Application) {
  app.get("/", (_req, res: express.Response) => {
    res.render("index");
  });

  app.get("/train", (req: express.Request, res: express.Response) => {
    res.render("train");
  });

  // If the request is anything else, either serve the stop page if it matches
  // a stop url, or the 404 page.
  app.all('*', (req: express.Request, res: express.Response) => {
    const stop = network?.stops.find(s => `/${s.urlName}` == req.url);
    if (network != null && stop != null) {
      serveStop(res, stop, network);
      return;
    }
    res.status(404).render("404");
  });
}

function setupNetwork(incoming: Network) {
  const firstTime = network == null;

  // Check the incoming network information to make sure no reserved routes are
  // being used by the stops custom url, e.g. no stop can have url "/js".
  const stopUrls = incoming.stops.map(s => `/${s.urlName}`);
  const badRoute = reservedRoutes.find(r => stopUrls.includes(r));
  if (badRoute != null) {
    const msg = `The route ${badRoute} wasn't not being reserved correctly.`;
    throw new Error(msg);
  }

  // Set the global variables (note that this only happens if there's no route
  // clashes).
  network = incoming;

  if (!firstTime) {
    console.log(`Refreshed data (network hash="${network.hash}").`);
    return;
  }

  console.log(`Downloaded data (network hash="${network.hash}").`);

  // Every 30 minutes re-download the data from the api to stay up to date.
  // If an error occurs, continue using the previous version of the data,
  // and try again in another 30 minutes.
  setInterval(async () => {
    try {
      setupNetwork(await fetchNetwork());
    }
    catch (ex) {
      // If an error occurs, just log it. The variable will still contain
      // the old data, so no need to touch it.
      console.log(`Error refreshing data (will continue using old data).`, ex);
    }
  }, dataRefreshIntervalMs);
}
