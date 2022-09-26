export abstract class Page<T> {
  html: T;

  constructor(html: T) {
    this.html = html;
  }

  abstract init(): Promise<void>;
}
