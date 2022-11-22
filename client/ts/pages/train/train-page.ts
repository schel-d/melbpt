import { DateTime } from "luxon";
import {
  directionIDZodSchema, LineGraph, LineGraphStop, lineIDZodSchema,
  platformIDZodSchema, StopID, stopIDZodSchema
} from "melbpt-utils";
import { z } from "zod";
import { ServiceElementsHtml, TrainPageHtml } from "./bundle";
import { callApi } from "../../utils/api-call";
import { domA, domDiv, domP } from "../../utils/dom-utils";
import { createLineDiagram } from "../../utils/line-diagram";
import { getNetwork } from "../../utils/network";
import { dateTimeZodSchema, timeMelbString, timeMelbStringWithoutDate }
  from "../../utils/time-utils";
import { Page } from "../page";

/** Zod parser for a single stop in the service from the API response. */
export const ServiceStopJson = z.object({
  stop: stopIDZodSchema,
  timeUTC: dateTimeZodSchema,
  platform: platformIDZodSchema.nullable(),
  setDownOnly: z.boolean()
});

/** Zod parser for a continuation in the service from the API response. */
export const ContinuationJson = z.object({
  id: z.string(),
  line: lineIDZodSchema,
  direction: directionIDZodSchema,
  timetabledDayOfWeek: z.string(),
  stops: ServiceStopJson.array()
});

/** Zod parser for the API response. */
export const ApiResponseJson = z.object({
  service: z.object({
    id: z.string(),
    line: lineIDZodSchema,
    direction: directionIDZodSchema,
    timetabledDayOfWeek: z.string(),
    stops: ServiceStopJson.array(),
    continuation: ContinuationJson.nullable()
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
 * Represents a continuation in a service.
 */
export type Continuation = z.infer<typeof ContinuationJson>;

/**
 * Controls the interactivity of the train page.
 */
export class TrainPage extends Page<TrainPageHtml> {
  serviceID: string | null;
  fromStopID: string | null;

  constructor(html: TrainPageHtml) {
    super(html);

    // Get the service ID and perspective stop from the URL.
    const url = new URL(window.location.href);
    this.serviceID = url.searchParams.get("id");
    this.fromStopID = url.searchParams.get("from");
  }

  async init() {
    try {
      // If a service ID was present in the URL, call the API to get the service
      // info.
      // Todo: callApi doesn't deal with "not found" correctly.
      const service = this.serviceID != null
        ? (await callApi(
          this.apiOrigin, "service/v1", { id: this.serviceID }, ApiResponseJson
        )).service
        : null;

      if (service == null) {
        // If the train is not found or service ID was not provided, display the
        // not found UI
        this.html.loadingDiv.classList.add("gone");
        this.html.notFoundDiv.classList.remove("gone");
      }
      else {
        // Otherwise show the train information.
        this.populateUI(service);
        this.html.loadingDiv.classList.add("gone");
        this.html.trainDiv.classList.remove("gone");
      }
    }
    catch (err) {
      // If something goes wrong, log the error and show the error UI.
      console.error(err);
      this.html.loadingDiv.classList.add("gone");
      this.html.errorDiv.classList.remove("gone");
    }
  }

  /**
   * Find the perspective stop for the service from the URL param. If anything
   * is wrong, returns null.
   * @param service The service, to check if the stop in the URL string is in
   * this service.
   */
  getPerspective(service: Service): ServiceStop | null {
    if (this.fromStopID == null) { return null; }

    const num = parseInt(this.fromStopID);
    if (isNaN(num)) { return null; }

    return service.stops.find(s => s.stop == num) ?? null;
  }

  /**
   * Displays the service information (including continuation if appropriate).
   * @param service The service.
   */
  populateUI(service: Service) {
    // Get info about the service terminus (for the page title).
    const terminus = service.stops[service.stops.length - 1].stop;
    const terminusData = getNetwork().requireStop(terminus);

    // Get the perspective stop (use the origin as a fallback).
    const origin = service.stops[0];
    const perspective = this.getPerspective(service) ?? origin;

    const nowUTC = DateTime.utc();

    // Set the page title.
    const departureTime = timeMelbStringWithoutDate(perspective.timeUTC);
    document.title = `${departureTime} ${terminusData.name} train | TrainQuery`;

    // Populate the main service UI.
    this.populateServiceUI(
      service, this.html.mainElements, nowUTC, perspective, false
    );

    // If the service has a continuation, show it...
    this.html.continuation.classList.toggle("gone", service.continuation == null);
    if (service.continuation != null) {
      // Populate the sentence above the continuation service UI.
      const newOrigin = service.continuation.stops[0];
      const newOriginName = getNetwork().requireStop(newOrigin.stop).name;
      this.html.continuationDeclaration.textContent =
        `At ${newOriginName}, this train continues as a...`;

      // Populate the continuation service UI.
      this.populateServiceUI(
        service.continuation, this.html.continuationElements, nowUTC,
        newOrigin, true
      );
    }
  }

  populateServiceUI(service: Service | Continuation, elements: ServiceElementsHtml,
    nowUTC: DateTime, perspective: ServiceStop, uncertain: boolean) {

    // Use the terminus as the title.
    const terminus = service.stops[service.stops.length - 1].stop;
    const terminusData = getNetwork().requireStop(terminus);
    elements.title.textContent = uncertain
      ? `${terminusData.name} train?`
      : `${terminusData.name} train`;

    // Use the "perspective" stop's departure time in the subtitle.
    const perspectiveData = getNetwork().requireStop(perspective.stop);
    const departureTime = timeMelbString(perspective.timeUTC, nowUTC);
    const departTense = perspective.timeUTC.diff(nowUTC).as("seconds") < 0
      ? "Departed"
      : "Departs";
    elements.subtitle.textContent = `${departTense} `
      + `${perspectiveData.name} at ${departureTime}`;

    // Create the line pill with a link to the line's page.
    const line = getNetwork().requireLine(service.line);
    elements.lineLink.href = `/lines/${line.id.toFixed()}`;
    elements.lineLink.className = `accent-${line.color}`;
    elements.lineP.textContent = `${line.name} Line`;

    // Create the stopping pattern diagram
    const map = this.createDiagram(service, perspective.stop, nowUTC);
    elements.stoppingPatternDiv.replaceChildren(map);
  }

  createDiagram(service: Service | Continuation, perspStopID: StopID,
    nowUTC: DateTime): HTMLDivElement {

    // Get the direction for this service (to get the list of stops, including
    // expresses).
    const line = getNetwork().requireLine(service.line);
    const direction = line.requireDirection(service.direction);

    // Work out the range of stops in this direction to display on the diagram
    // (again, including expresses).
    const origin = service.stops[0].stop;
    const terminus = service.stops[service.stops.length - 1].stop;
    const originIndex = direction.stops.indexOf(origin);
    const terminusIndex = direction.stops.indexOf(terminus);
    const stopsOnService = direction.stops.slice(originIndex, terminusIndex + 1);

    // Work out where the threshold between semi-transparent stops and fully
    // opaque stops is.
    const perspectiveIndex = stopsOnService.indexOf(perspStopID);

    const getServiceStop = (x: StopID) => service.stops.find(s => s.stop == x);

    // Create the line graph (details about what to show in the diagram).
    const isExpress = (x: StopID) => getServiceStop(x) == null;
    const lineGraph = new LineGraph(
      stopsOnService.map(x => new LineGraphStop(x, isExpress(x))),
      null,
      null,
      perspectiveIndex
    );

    // Create the detailer (function which decides what is displayed next to
    // each stop notch).
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

    // Create the line diagram, using the graph and detailer created above.
    return createLineDiagram(
      "line-diagram", lineGraph, detailer, line.color
    );
  }
}

/** Creates the UI for a stop on the diagram that is NOT express. */
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

/** Creates the UI for an express stop on the diagram. */
function createExpressStopDetails(name: string, stopUrlName: string) {
  const $stopName = domP(`Skips ${name}`, "stop-name");
  const $stopNameOneLine = domDiv("one-line");
  $stopNameOneLine.append($stopName);

  const $details = domA(`/${stopUrlName}`, "stop-details express");
  $details.style.paddingLeft = `2.5rem`;
  $details.append($stopNameOneLine);

  return $details;
}
