import { StaticPageHtml } from "./bundle";
import { Page } from "../page";

export class StaticPage extends Page<StaticPageHtml> {
  constructor(html: StaticPageHtml) {
    super(html);
  }

  async init() {
    // Intentionally empty. This is a static page!
  }
}
