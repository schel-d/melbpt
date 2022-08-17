import { getElementOrThrow } from "../dom-utils";
import { Network } from "../network";
import { getStopName } from "../network-utils";
import { fetchService, Service } from "../train/service-request";

const loadingDiv = getElementOrThrow("loading");
const errorDiv = getElementOrThrow("error");
const notFoundDiv = getElementOrThrow("not-found");
const trainDiv = getElementOrThrow("train");
const trainTitle = getElementOrThrow("train-title");
const trainSubtitle = getElementOrThrow("train-subtitle");

const url = new URL(window.location.href);
const serviceID = url.searchParams.get("id");
const perspective = url.searchParams.get("from");

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
  const terminusName = getStopName(network, terminus);

  trainTitle.textContent = `${terminusName} train`;

  if (perspective == null) {
    trainSubtitle.textContent = `${terminusName} train`;
  }
  else {
    trainSubtitle.textContent = `${terminusName} train`;
  }
}
