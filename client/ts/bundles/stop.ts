import { DateTime } from "luxon";
import { domA, domDiv, domP, getElementOrThrow } from "../dom-utils";
import { fetchDepartures } from "../stop/departure-request";
import { createLoadingSpinner } from "../loading-spinner";
import { DepartureGroup, determineDepartureGroups }
  from "../stop/departure-group";
import { createDepartureGroup, departureHeightRem } from "../stop/departure-group-div";
import { DepartureModel } from "../stop/departure-model";
import { OdometerController } from "../stop/odometer";
import { createDepartureDiv } from "../stop/departure-div";
import { minsDelta } from "../time-utils";

declare global {
  interface Window { stopID: number }
}

const stopID = window.stopID;
let lastUpdate: DateTime | null = null;

function init() {

  const groups = determineDepartureGroups(stopID);
  const controllers = groups.map(g => new DepartureGroupController(g));

  const departuresDiv = getElementOrThrow("departures");
  departuresDiv.append(...controllers.map(c => c.groupDiv));

  setInterval(() => { update(stopID, controllers); }, 1000);
  update(stopID, controllers);
}

async function update(stopID: number, controllers: DepartureGroupController[]) {
  const now = DateTime.utc().startOf("minute");
  if (lastUpdate != null && lastUpdate.equals(now)) { return; }
  lastUpdate = now;

  controllers.forEach(c => c.updateOdometers());

  const count = Math.max(...controllers.map(c => c.group.count));
  const filters = controllers.map(c => c.group.filter + " narr nsdo");

  try {
    const response = await fetchDepartures(stopID, now, count, false, filters);
    const stop = response.network.stops.find(s => s.id == stopID);
    if (stop == null) { throw new Error(`Couldn't find this stop in the network.`); }

    controllers.forEach((c, i) => {
      const departures = response.departures[i];
      const models = departures.map(d => new DepartureModel(d, stop, response.network));
      c.showDepartures(models);
    });
  }
  catch {
    controllers.forEach(c => c.showError());
  }
}

/**
 * Controls the UI for each departure group.
 */
class DepartureGroupController {
  group: DepartureGroup;
  groupDiv: HTMLDivElement;
  departuresListDiv: HTMLDivElement;

  models: DepartureModel[];
  departureDivs: HTMLAnchorElement[];
  departureOdometers: OdometerController<DepartureModel | null>[];
  currentTimeOdometers: (OdometerController<number> | null)[];

  constructor(group: DepartureGroup) {
    this.group = group;

    const ui = createDepartureGroup(group.title, group.subtitle, group.count);
    this.groupDiv = ui.groupDiv;
    this.departuresListDiv = ui.departuresListDiv;

    this.models = [];
    this.departureDivs = [];
    this.departureOdometers = [];
    this.currentTimeOdometers = [];
    this.showLoading();
  }

  showDepartures(newModels: DepartureModel[]) {
    if (newModels.length == 0) {
      this.models = [];
      const messageP = domP("No trains scheduled", "message");
      this.departuresListDiv.replaceChildren(messageP);
      return;
    }

    const hadModels = this.models.length != 0;
    this.models = newModels;

    if (newModels.length != 0 && !hadModels) {
      this.departureDivs = [];
      this.departureOdometers = [];
      this.currentTimeOdometers = [];

      for (let i = 0; i < this.group.count; i++) {
        const departureDiv = domA("#", "departure");
        departureDiv.style.height = `${departureHeightRem}rem`;
        const odometer = new OdometerController<DepartureModel | null>(
          this.models[i] ?? null,
          (a, b) => a != null && b != null && a.equals(b),
          (model) => {
            const now = DateTime.utc().startOf("minute");
            if (model == null) {
              this.currentTimeOdometers[i] = null;
              return document.createElement("div");
            }
            else {
              const departureInnerDiv = createDepartureDiv(model, now);
              this.currentTimeOdometers[i] = departureInnerDiv.odometer;
              return departureInnerDiv.departureDiv;
            }
          }
        );

        departureDiv.append(odometer.div);
        this.departureOdometers.push(odometer);
        this.departureDivs.push(departureDiv);
      }
      this.departuresListDiv.replaceChildren(...this.departureDivs);
    }

    this.departureDivs.forEach((d, i) => d.href = this.models[i]?.serviceUrl ?? null);
    this.departureOdometers.forEach((d, i) => d.update(this.models[i] ?? null));
  }
  updateOdometers() {
    const now = DateTime.utc().startOf("minute");

    this.currentTimeOdometers.forEach((d, i) => {
      if (d == null) { return; }
      d.update(minsDelta(this.models[i].timeUTC, now));
    });
  }
  showLoading() {
    this.models = [];
    const spinner = createLoadingSpinner("loading-spinner");
    this.departuresListDiv.replaceChildren(spinner);
  }
  showError() {
    this.models = [];
    const errorP = domP("Something went wrong", "message error");
    this.departuresListDiv.replaceChildren(errorP);
  }
}

init();
