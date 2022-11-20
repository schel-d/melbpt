import { DateTime } from "luxon";
import {
  Direction, directionIDZodSchema, LineColor, LineGraph, LineGraphStop,
  lineIDZodSchema, platformIDZodSchema, StopID, stopIDZodSchema
} from "melbpt-utils";
import { z } from "zod";
import { TrainPageHtml } from "./bundle";
import { callApi } from "../../utils/api-call";
import { domA, domDiv, domP } from "../../utils/dom-utils";
import { createLineDiagram } from "../../utils/line-diagram";
import { getNetwork } from "../../utils/network";
import { dateTimeZodSchema, timeMelbString } from "../../utils/time-utils";
import { Page } from "../page";

/** Zod parser for a single stop in the service from the API response. */
export const ServiceStopJson = z.object({
  stop: stopIDZodSchema,
  timeUTC: dateTimeZodSchema,
  platform: platformIDZodSchema.nullable(),
  setDownOnly: z.boolean()
});

/** Zod parser for the API response. */
export const ApiResponseJson = z.object({
  service: z.object({
    id: z.string(),
    line: lineIDZodSchema,
    direction: directionIDZodSchema,
    timetabledDayOfWeek: z.string(),
    stops: ServiceStopJson.array()
  })
});

/**
 * Represents a single stop in a service.
 */
export type ServiceStop = z.infer<typeof ServiceStopJson>;

/**
 * Represents a service.
 */
export type Service = z.infer<typeof ApiResponseJson.shape.service>;

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
      const service = this.serviceID != null
        ? (await callApi(
          this.apiOrigin, "service/v1", { id: this.serviceID }, ApiResponseJson
        )).service
        : null;

      if (service == null) {
        this.html.loadingDiv.classList.add("gone");
        this.html.notFoundDiv.classList.remove("gone");
      }
      else {
        this.populateUI(service);

        this.html.loadingDiv.classList.add("gone");
        this.html.trainDiv.classList.remove("gone");
      }
    }
    catch (err) {
      console.error(err);
      this.html.loadingDiv.classList.add("gone");
      this.html.errorDiv.classList.remove("gone");
    }
  }

  populateUI(service: Service) {
    const terminus = service.stops[service.stops.length - 1].stop;
    const terminusData = getNetwork().requireStop(terminus);

    const perspective = this.getPerspective(service);

    const origin = service.stops[0];
    const subtitlePersp = perspective ?? origin;
    const subtitlePerspData = getNetwork().requireStop(subtitlePersp.stop);

    const nowUTC = DateTime.utc();
    const departureTime = timeMelbString(subtitlePersp.timeUTC, nowUTC);
    this.html.trainTitle.textContent = `${terminusData.name} train`;

    const departTense = subtitlePersp.timeUTC.diff(nowUTC).as("seconds") < 0
      ? "Departed"
      : "Departs";
    this.html.trainSubtitle.textContent = `${departTense} `
      + `${subtitlePerspData.name} at ${departureTime}`;

    document.title = `${departureTime} ${terminusData.name} train | TrainQuery`;

    const line = getNetwork().requireLine(service.line);
    this.html.lineLink.href = `/lines/${line.id.toFixed()}`;
    this.html.lineLink.className = `accent-${line.color}`;
    this.html.lineP.textContent = `${line.name} Line`;

    const direction = line.directions.find(d => d.id == service.direction);
    if (direction == null) {
      throw new Error(`Direction not found.`);
    }

    this.createStoppingPatternMap(
      service, direction, subtitlePersp.stop, nowUTC, line.color
    );
  }

  getPerspective(service: Service): ServiceStop | null {
    if (this.fromStopID == null) { return null; }

    const num = parseInt(this.fromStopID);
    if (isNaN(num)) { return null; }

    return service.stops.find(s => s.stop == num) ?? null;
  }

  createStoppingPatternMap(service: Service, direction: Direction,
    perspStopID: StopID, nowUTC: DateTime, color: LineColor) {

    const origin = service.stops[0].stop;
    const terminus = service.stops[service.stops.length - 1].stop;
    const originIndex = direction.stops.indexOf(origin);
    const terminusIndex = direction.stops.indexOf(terminus);
    const stopsOnService = direction.stops.slice(originIndex, terminusIndex + 1);
    const perspectiveIndex = stopsOnService.indexOf(perspStopID);

    const getServiceStop = (x: StopID) => service.stops.find(s => s.stop == x);
    const isExpress = (x: StopID) => getServiceStop(x) == null;

    const lineGraph = new LineGraph(
      stopsOnService.map(x => new LineGraphStop(x, isExpress(x))),
      null,
      null,
      perspectiveIndex
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const detailer = (stopID: StopID, express: boolean, _insetRem: number) => {
      const stop = getNetwork().requireStop(stopID);
      if (express) {
        return createExpressStopDetails(stop.name, stop.urlName);
      }

      const serviceStop = getServiceStop(stopID);
      if (serviceStop == null) {
        throw new Error("LineGraph is invalid (express flag for stop not set).");
      }

      const time = serviceStop.timeUTC;
      const platformName = serviceStop.platform == null
        ? null
        : stop.requirePlatform(serviceStop.platform).name;

      return createRegularStopDetails(
        stop.name, stop.urlName, time, platformName, nowUTC
      );
    };

    const lineDiagram = createLineDiagram(
      "line-diagram", lineGraph, detailer, color
    );
    this.html.stoppingPatternDiv.replaceChildren(lineDiagram);
  }
}

function createRegularStopDetails(name: string, stopUrlName: string,
  timeUTC: DateTime, platformName: string | null, nowUTC: DateTime) {

  const $stopName = domP(name, "stop-name");
  const $stopNameOneLine = domDiv("one-line");
  $stopNameOneLine.append($stopName);

  const $dot1 = domP("•", "separator-dot");
  const $stopTime = domP(timeMelbString(timeUTC, nowUTC), "stop-time");

  const $details = domA(`/${stopUrlName}`, "stop-details");
  $details.style.paddingLeft = `2.5rem`;
  $details.append($stopNameOneLine, $dot1, $stopTime);

  if (platformName != null) {
    const $dot2 = domP("•", "separator-dot");
    const $platform = domP(`Plat. ${platformName}`, "platform");
    $details.append($dot2, $platform);
  }

  return $details;
}

function createExpressStopDetails(name: string, stopUrlName: string) {
  const $stopName = domP(`Skips ${name}`, "stop-name");
  const $stopNameOneLine = domDiv("one-line");
  $stopNameOneLine.append($stopName);

  const $details = domA(`/${stopUrlName}`, "stop-details express");
  $details.style.paddingLeft = `2.5rem`;
  $details.append($stopNameOneLine);

  return $details;
}
