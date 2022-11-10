import express from "express";

/**
 * Responsible for ensuring the API origin and public hash string are provided
 * to every html page being served.
 */
export class Renderer {
  /**
   * The origin of the API server. Usually "https://api.trainquery.com", unless
   * we're in "offline mode", where the local "http://localhost:3001" is used.
   */
  readonly apiOrigin: string;

  /**
   * To allow for long caching, a folder with a random hash string is created
   * inside the public directory. All CSS, JS, and images are inside that
   * folder, so the pug file needs to know this folder name so it can link to
   * those files properly.
   */
  readonly publicHashString: string;

  /**
   * Creates a {@link Renderer}.
   * @param apiOrigin The origin of the API server. Usually
   * "https://api.trainquery.com", unless we're in "offline mode", where the
   * local "http://localhost:3001" is used.
   * @param publicHashString To allow for long caching, a folder with a random
   * hash string is created inside the public directory. All CSS, JS, and images
   * are inside that folder, so the pug file needs to know this folder name so
   * it can link to those files properly.
   */
  constructor(apiOrigin: string, publicHashString: string) {
    this.apiOrigin = apiOrigin;
    this.publicHashString = publicHashString;
  }

  /**
   * Renders and serves a pug file. The api origin and public hash string are
   * automatically appended onto the variables passed to the pug renderer.
   * @param res The object provided by express to respond to this request.
   * @param pugFile The pug file to render.
   * @param variables The variables to pass to the pug renderer.
   */
  serve(res: express.Response, pugFile: string, variables: object = {}) {
    res.render(pugFile, {
      apiOrigin: this.apiOrigin,
      publicHashString: this.publicHashString,
      ...variables
    });
  }
}
