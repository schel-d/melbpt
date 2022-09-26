import { DateTime } from "luxon";
import { domA, domDiv, domOneLineP, domP, getAnchorOrThrow, getElementOrThrow }
  from "../../utils/dom-utils";
import { Direction, Network } from "../../utils/network";
import { timeMelbString } from "../../utils/time-utils";
import { Page } from "../page";
import { fetchService, Service, ServiceStop } from "./service-request";

/**
 * Controls the interactivity of the train page.
 */
export class TrainPage extends Page {
  loadingDiv: HTMLElement;
  errorDiv: HTMLElement;
  notFoundDiv: HTMLElement;
  trainDiv: HTMLElement;
  trainTitle: HTMLElement;
  trainSubtitle: HTMLElement;
  lineLink: HTMLAnchorElement;
  lineP: HTMLElement;
  stoppingPatternDiv: HTMLElement;

  serviceID: string | null;
  fromStopID: string | null;

  constructor() {
    super();

    this.loadingDiv = getElementOrThrow("loading");
    this.errorDiv = getElementOrThrow("error");
    this.notFoundDiv = getElementOrThrow("not-found");
    this.trainDiv = getElementOrThrow("train");
    this.trainTitle = getElementOrThrow("train-title");
    this.trainSubtitle = getElementOrThrow("train-subtitle");
    this.lineLink = getAnchorOrThrow("line-link");
    this.lineP = getElementOrThrow("line");
    this.stoppingPatternDiv = getElementOrThrow("stopping-pattern");

    const url = new URL(window.location.href);
    this.serviceID = url.searchParams.get("id");
    this.fromStopID = url.searchParams.get("from");
  }

  async init() {
    try {
      const response = this.serviceID != null
        ? await fetchService(this.serviceID)
        : null;

      if (response == null) {
        this.loadingDiv.classList.add("gone");
        this.notFoundDiv.classList.remove("gone");
      }
      else {
        this.populateUI(response.service, response.network);

        this.loadingDiv.classList.add("gone");
        this.trainDiv.classList.remove("gone");
      }
    }
    catch {
      this.loadingDiv.classList.add("gone");
      this.errorDiv.classList.remove("gone");
    }
  }

  populateUI(service: Service, network: Network) {
    const terminus = service.stops[service.stops.length - 1].stop;
    const terminusData = network.stops.find(s => s.id == terminus);
    if (terminusData == null) {
      throw new Error(`Terminus not found.`);
    }

    const perspective = this.getPerspective(service);

    const origin = service.stops[0];
    const subtitlePersp = perspective ?? origin;
    const subtitlePerspData = network.stops.find(s => s.id == subtitlePersp.stop);
    if (subtitlePerspData == null) {
      throw new Error(`Perspective stop not found.`);
    }

    const nowUTC = DateTime.utc();
    const departureTime = timeMelbString(subtitlePersp.timeUTC, nowUTC);
    this.trainTitle.textContent = `${terminusData.name} train`;

    const departTense = subtitlePersp.timeUTC.diff(nowUTC).as("seconds") < 0
      ? "Departed"
      : "Departs";
    this.trainSubtitle.textContent = `${departTense} ${subtitlePerspData.name} at `
      + `${departureTime}`;

    document.title = `${departureTime} ${terminusData.name} train | TrainQuery`;

    const line = network.lines.find(l => l.id == service.line);
    if (line == null) {
      throw new Error(`Line not found.`);
    }
    this.lineLink.href = `/lines/${line.id.toFixed()}`;
    this.lineLink.className = `accent-${line.color}`;
    this.lineP.textContent = `${line.name} Line`;

    const direction = line.directions.find(d => d.id == service.direction);
    if (direction == null) {
      throw new Error(`Direction not found.`);
    }

    this.stoppingPatternDiv.className = `accent-${line.color}`;
    this.createStoppingPatternMap(
      service, network, direction, subtitlePersp.stop, nowUTC
    );
  }

  getPerspective(service: Service): ServiceStop | null {
    if (this.fromStopID == null) { return null; }

    const num = parseInt(this.fromStopID);
    if (isNaN(num)) { return null; }

    return service.stops.find(s => s.stop == num) ?? null;
  }

  createStoppingPatternMap(service: Service, network: Network,
    direction: Direction, perspStopID: number, nowUTC: DateTime) {

    const origin = service.stops[0].stop;
    const terminus = service.stops[service.stops.length - 1].stop;
    const originIndex = direction.stops.indexOf(origin);
    const terminusIndex = direction.stops.indexOf(terminus);
    const stopsOnService = direction.stops.slice(originIndex, terminusIndex + 1);
    const perspectiveIndex = stopsOnService.indexOf(perspStopID);

    this.stoppingPatternDiv.replaceChildren(...stopsOnService.map((s, index) => {
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
        stopDiv.append(domOneLineP(`Skips ${stopData.name}`, "stop-name"));
      }
      else {
        stopDiv.append(domOneLineP(`${stopData.name}`, "stop-name"));
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
}
