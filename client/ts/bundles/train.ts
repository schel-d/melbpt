import { TrainPage } from "../pages/train/train-page";
import { finder } from "../utils/finder";

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

new TrainPage(html).init();
