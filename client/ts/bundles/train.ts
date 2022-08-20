import { DateTime } from "luxon";
import { domA, domDiv, domP, getAnchorOrThrow, getElementOrThrow } from "../dom-utils";
import { Direction, Network, Stop } from "../network";
import { getStopName } from "../network-utils";
import { timeMelbString } from "../time-utils";
import { fetchService, Service, ServiceStop } from "../train/service-request";

const loadingDiv = getElementOrThrow("loading");
const errorDiv = getElementOrThrow("error");
const notFoundDiv = getElementOrThrow("not-found");
const trainDiv = getElementOrThrow("train");
const trainTitle = getElementOrThrow("train-title");
const trainSubtitle = getElementOrThrow("train-subtitle");
const lineLink = getAnchorOrThrow("line-link");
const lineP = getElementOrThrow("line");
const stoppingPatternDiv = getElementOrThrow("stopping-pattern");

const nowUTC = DateTime.utc();

const url = new URL(window.location.href);
const serviceID = url.searchParams.get("id");
const fromStopID = url.searchParams.get("from");

init();

async function init() {
  try {
    const response = serviceID != null ? await fetchService(serviceID) : null;

    if (response == null) {
      loadingDiv.classList.add("gone");
      notFoundDiv.classList.remove("gone");
    }
    else {
      populateUI(response.service, response.network);

      loadingDiv.classList.add("gone");
      trainDiv.classList.remove("gone");
    }
  }
  catch {
    loadingDiv.classList.add("gone");
    errorDiv.classList.remove("gone");
  }
}

function populateUI(service: Service, network: Network) {
  const terminus = service.stops[service.stops.length - 1].stop;
  const terminusData = network.stops.find(s => s.id == terminus);
  if (terminusData == null) {
    throw new Error(`Terminus not found.`);
  }

  const perspective = getPerspective(service);

  const origin = service.stops[0];
  const subtitlePersp = perspective ?? origin;
  const subtitlePerspData = network.stops.find(s => s.id == subtitlePersp.stop);
  if (subtitlePerspData == null) {
    throw new Error(`Perspective stop not found.`);
  }

  const departureTime = timeMelbString(subtitlePersp.timeUTC, nowUTC);
  trainTitle.textContent = `${terminusData.name} train`;

  const departTense = subtitlePersp.timeUTC.diff(nowUTC).as("seconds") < 0
    ? "Departed"
    : "Departs";
  trainSubtitle.textContent = `${departTense} ${subtitlePerspData.name} at `
    + `${departureTime}`;

  document.title = `${departureTime} ${terminusData.name} train | TrainQuery`;

  const line = network.lines.find(l => l.id == service.line);
  if (line == null) {
    throw new Error(`Line not found.`);
  }
  lineLink.href = `/lines/${line.id.toFixed()}`;
  lineLink.className = `accent-${line.color}`;
  lineP.textContent = `${line.name} Line`;

  const direction = line.directions.find(d => d.id == service.direction);
  if (direction == null) {
    throw new Error(`Direction not found.`);
  }

  stoppingPatternDiv.className = `accent-${line.color}`;
  createStoppingPatternMap(service, network, direction, subtitlePersp.stop);
}

function getPerspective(service: Service): ServiceStop | null {
  if (fromStopID == null) { return null; }

  const num = parseInt(fromStopID);
  if (isNaN(num)) { return null; }

  return service.stops.find(s => s.stop == num) ?? null;
}

function createStoppingPatternMap(service: Service, network: Network,
  direction: Direction, perspStopID: number) {

  const origin = service.stops[0].stop;
  const terminus = service.stops[service.stops.length - 1].stop;
  const originIndex = direction.stops.indexOf(origin);
  const terminusIndex = direction.stops.indexOf(terminus);
  const stopsOnService = direction.stops.slice(originIndex, terminusIndex + 1);
  const perspectiveIndex = stopsOnService.indexOf(perspStopID);

  stoppingPatternDiv.replaceChildren(...stopsOnService.map((s, index) => {
    const stopData = network.stops.find(sd => sd.id == s);
    if (stopData == null) {
      throw new Error("Stop not found.");
    }

    const serviceStop = service.stops.find(ss => ss.stop == s);

    const stopDiv = domA(`/${stopData.urlName}`, "stop");
    stopDiv.append(domDiv("node"));
    stopDiv.append(domDiv("edge"));

    if (index < perspectiveIndex) {
      stopDiv.classList.add("prior");
    }

    if (serviceStop == null) {
      stopDiv.classList.add("express");
      stopDiv.append(domP(`Skips ${stopData.name}`, "stop-name"));
    }
    else {
      stopDiv.append(domP(`${stopData.name}`, "stop-name"));
      stopDiv.append(domP("•", "separator-dot"));

      const departureTime = timeMelbString(serviceStop.timeUTC, nowUTC);
      stopDiv.append(domP(departureTime, "stop-time"));

      if (serviceStop.platform != null) {
        const platform = stopData.platforms.find(p => p.id == serviceStop.platform);
        if (platform == null) {
          throw new Error("Platform not found.");
        }
        stopDiv.append(domP("•", "separator-dot"));
        stopDiv.append(domP(`Plat. ${platform.name}`, "platform"));
      }
    }

    return stopDiv;
  }));
}
