import { DateTime } from "luxon";
import { TrainPageHtml } from "../../bundles/train";
import { domA, domDiv, domOneLineP, domP } from "../../utils/dom-utils";
import { Direction, Network } from "../../utils/network";
import { timeMelbString } from "../../utils/time-utils";
import { Page } from "../page";
import { fetchService, Service, ServiceStop } from "./service-request";

/**
 * Controls the interactivity of the train page.
 */
export class TrainPage extends Page<TrainPageHtml> {
  serviceID: string | null;
  fromStopID: string | null;

  constructor(html: TrainPageHtml) {
    super(html);

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
        this.html.loadingDiv.classList.add("gone");
        this.html.notFoundDiv.classList.remove("gone");
      }
      else {
        this.populateUI(response.service, response.network);

        this.html.loadingDiv.classList.add("gone");
        this.html.trainDiv.classList.remove("gone");
      }
    }
    catch {
      this.html.loadingDiv.classList.add("gone");
      this.html.errorDiv.classList.remove("gone");
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
    this.html.trainTitle.textContent = `${terminusData.name} train`;

    const departTense = subtitlePersp.timeUTC.diff(nowUTC).as("seconds") < 0
      ? "Departed"
      : "Departs";
    this.html.trainSubtitle.textContent = `${departTense} `
      + `${subtitlePerspData.name} at ${departureTime}`;

    document.title = `${departureTime} ${terminusData.name} train | TrainQuery`;

    const line = network.lines.find(l => l.id == service.line);
    if (line == null) {
      throw new Error(`Line not found.`);
    }
    this.html.lineLink.href = `/lines/${line.id.toFixed()}`;
    this.html.lineLink.className = `accent-${line.color}`;
    this.html.lineP.textContent = `${line.name} Line`;

    const direction = line.directions.find(d => d.id == service.direction);
    if (direction == null) {
      throw new Error(`Direction not found.`);
    }

    this.html.stoppingPatternDiv.className = `accent-${line.color}`;
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

    this.html.stoppingPatternDiv.replaceChildren(...stopsOnService.map((s, index) => {
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