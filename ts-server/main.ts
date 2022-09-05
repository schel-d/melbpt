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

let network: Network | null = null;

export async function main(offlineMode: boolean) {
  const apiDomain = offlineMode ? "http://localhost:3001" : "https://api.trainquery.com";

  console.log("Starting...");

  const app = express();
  const port = process.env.PORT ?? 3000;

  app.use(compression());

  app.set("views", "./client/pug");
  app.set("view engine", "pug");
  app.use(express.static(".out/public"));

  try {
    setupNetwork(await fetchNetwork(apiDomain), apiDomain);
    registerRoutes(app, apiDomain);
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

function registerRoutes(app: express.Application, apiDomain: string) {
  app.get("/", (_req, res: express.Response) => {
    res.render("index", { apiDomain: apiDomain });
  });

  app.get("/lines", (_req: express.Request, res: express.Response) => {
    const lines = network?.lines
      .map(l => { return { id: l.id, name: l.name, service: l.service }; })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (lines != null) {
      res.render("lines", { apiDomain: apiDomain, lines: lines });
      return;
    }
    res.sendStatus(500);
  });

  app.get("/about", (_req: express.Request, res: express.Response) => {
    res.render("about", { apiDomain: apiDomain });
  });

  app.get("/settings", (_req: express.Request, res: express.Response) => {
    res.render("settings", { apiDomain: apiDomain });
  });

  app.get("/train", (_req: express.Request, res: express.Response) => {
    res.render("train", { apiDomain: apiDomain });
  });

  // If the request is anything else, either serve the stop page if it matches
  // a stop url, or the 404 page.
  app.all('*', (req: express.Request, res: express.Response) => {
    const stop = network?.stops.find(s => `/${s.urlName}` == req.path);
    if (network != null && stop != null) {
      serveStop(res, stop, network, apiDomain);
      return;
    }

    const line = network?.lines.find(l => `/lines/${l.id.toFixed()}` == req.path);
    if (network != null && line != null) {
      const stops = [...new Set(line.directions.map(d => d.stops).flat())];
      const stopData = stops.map(s => {
        const data = network?.stops.find(ss => ss.id == s);
        if (data == null) { throw new Error("Stop not found."); }
        return {
          id: s,
          name: data.name,
          urlName: data.urlName
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      res.render("line", {
        apiDomain: apiDomain, name: line.name, service: line.service, stops: stopData
      });
      return;
    }
    res.status(404).render("404", { apiDomain: apiDomain });
  });
}

function setupNetwork(incoming: Network, apiDomain: string) {
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

  console.log(`Fetched data (network hash="${network.hash}").`);

  // Every 30 minutes re-download the data from the api to stay up to date.
  // If an error occurs, continue using the previous version of the data,
  // and try again in another 30 minutes.
  setInterval(async () => {
    try {
      setupNetwork(await fetchNetwork(apiDomain), apiDomain);
    }
    catch (ex) {
      // If an error occurs, just log it. The variable will still contain
      // the old data, so no need to touch it.
      console.log(`Error refreshing data (will continue using old data).`, ex);
    }
  }, dataRefreshIntervalMs);
}
