import { setupPage } from "../pages/page";
import { TrainPage } from "../pages/train/train-page";
import { finder } from "schel-d-utils-browser";

declare global {
  interface Window {
    apiOrigin: string
  }
}

const html = {
  loadingDiv: finder.div("loading"),
  errorDiv: finder.div("error"),
  notFoundDiv: finder.div("not-found"),
  trainDiv: finder.div("train"),
  trainTitle: finder.any("train-title"),
  trainSubtitle: finder.any("train-subtitle"),
  lineLink: finder.anchor("line-link"),
  lineP: finder.any("line"),
  stoppingPatternDiv: finder.div("stopping-pattern")
};
export type TrainPageHtml = typeof html;

setupPage(() => new TrainPage(html, window.apiOrigin));
