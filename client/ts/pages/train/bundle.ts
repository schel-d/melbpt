import { setupPage } from "../page";
import { TrainPage } from "./train-page";
import { finder } from "schel-d-utils-browser";

const html = {
  loadingDiv: finder.div("loading"),
  errorDiv: finder.div("error"),
  notFoundDiv: finder.div("not-found"),

  trainDiv: finder.div("train"),
  mainElements: {
    title: finder.any("train-title"),
    subtitle: finder.any("train-subtitle"),
    lineLink: finder.anchor("line-link"),
    lineP: finder.any("line"),
    stoppingPatternDiv: finder.div("stopping-pattern"),
  },

  continuation: finder.div("continuation"),
  continuationDeclaration: finder.any("continuation-declaration"),
  continuationElements: {
    title: finder.any("continuation-title"),
    subtitle: finder.any("continuation-subtitle"),
    lineLink: finder.anchor("continuation-line-link"),
    lineP: finder.any("continuation-line"),
    stoppingPatternDiv: finder.div("continuation-stopping-pattern"),
  }
};
export type TrainPageHtml = typeof html;
export type ServiceElementsHtml =
  typeof html.mainElements & typeof html.continuationElements;

setupPage(() => new TrainPage(html));
