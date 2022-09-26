import { getNetwork } from "../utils/network";
import { StopPage } from "../pages/stop/stop-page";

// Retrieve the stop ID from the window object. The stop ID is stored in the
// window by a script created dynamically by the server (check the pug
// file).
declare global { interface Window { stopID: number } }
const stopID = window.stopID;

// We don't need to store it, but create a stop page object to run the code.
getNetwork().then(network => new StopPage(network, stopID).init());
