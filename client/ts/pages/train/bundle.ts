import { setupPage } from "../page";
import { TrainPage } from "./train-page";
import { find } from "schel-d-utils-browser";

const html = {
  loadingDiv: find.div("loading"),
  errorDiv: find.div("error"),
  notFoundDiv: find.div("not-found"),

  trainDiv: find.div("train"),
  mainElements: {
    title: find.any("train-title"),
    subtitle: find.any("train-subtitle"),
    lineLink: find.anchor("line-link"),
    lineP: find.any("line"),
    stoppingPatternDiv: find.div("stopping-pattern"),
  },

  continuation: find.div("continuation"),
  continuationDeclaration: find.any("continuation-declaration"),
  continuationElements: {
    title: find.any("continuation-title"),
    subtitle: find.any("continuation-subtitle"),
    lineLink: find.anchor("continuation-line-link"),
    lineP: find.any("continuation-line"),
    stoppingPatternDiv: find.div("continuation-stopping-pattern"),
  }
};
export type TrainPageHtml = typeof html;
export type ServiceElementsHtml =
  typeof html.mainElements & typeof html.continuationElements;

setupPage(() => new TrainPage(html));
