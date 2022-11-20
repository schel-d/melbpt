import { TransitNetwork } from "melbpt-utils";
import { AnyZodObject, z, ZodType } from "zod";
import { getNetwork, updateNetwork } from "./network";

/** Zod schema for API calls that provide updated network data if needed. */
export const NetworkJson = z.object({
  network: TransitNetwork.json.nullable()
});

/** Options for {@link callApi}. */
export interface Options {
  ensureUpdatedNetwork?: boolean;
}

/** When resiliency is enabled, make a second attempt after 500 milliseconds. */
const firstResiliencyInterval = 500;

/** When resiliency is enabled, make a third attempt after 2 seconds. */
const secondResiliencyInterval = 2000;

/**
 * Calls the API and parses the JSON recieved. This function passes the current
 * transit network hash along with the request and updates the stored data if
 * the server replies with one with a different hash.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param path The API path, e.g. "line-details/v1".
 * @param params The url parameters, e.g. `{ id: "1" }` adds "?id=1" to the url.
 * @param schema The schema of the JSON the API returns (not including network).
 * @param resilient Should multiple attempts be made if the first fails? True by
 * default.
 */
export async function callApi<T extends AnyZodObject>(origin: string,
  path: string, params: Record<string, string>, schema: T,
  resilient = true): Promise<z.infer<T>> {

  try {
    // Append the network hash to the params, and make the request.
    const fullParams = { hash: getNetwork().hash, ...params };
    const responseJson = await callApiCommon(origin, path, fullParams, resilient);
    const response = schema.strip().parse(responseJson);

    // If the API has data in the "network" key (instead of null), then the hash
    // we gave was stale and this is the updated data, so store it.
    const networkResponse = NetworkJson.parse(responseJson);
    if (networkResponse.network != null) {
      updateNetwork(networkResponse.network);
    }

    return response;
  }
  catch {
    throw ApiError.unknownError();
  }
}

/**
 * Calls the API and parses the JSON recieved. This function does NOT ask the
 * API to check for updated transit network data.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param path The API path, e.g. "line-details/v1".
 * @param params The url parameters, e.g. `{ id: "1" }` adds "?id=1" to the url.
 * @param schema The schema of the JSON the API returns.
 * @param resilient Should multiple attempts be made if the first fails? True by
 * default.
 */
export async function callApiNoHash<T extends ZodType>(origin: string,
  path: string, params: Record<string, string>, schema: T,
  resilient = true): Promise<z.infer<T>> {

  try {
    // Make the request and parse the JSON returned.
    const responseJson = await callApiCommon(origin, path, params, resilient);
    return schema.parse(responseJson);
  }
  catch {
    throw ApiError.unknownError();
  }
}

/**
 * Calls the API and returns the JSON recieved.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param path The API path, e.g. "line-details/v1".
 * @param params The url parameters, e.g. `{ id: "1" }` adds "?id=1" to the url.
 * @param resilient Should multiple attempts be made if the first fails? True by
 * default.
 */
async function callApiCommon(origin: string, path: string,
  params: Record<string, string>, resilient: boolean): Promise<unknown> {

  // Build the URL for the GET request.
  const url = new URL(origin);
  url.pathname = path;
  for (const param of Object.keys(params)) {
    url.searchParams.append(param, params[param]);
  }

  const makeRequest = async () => {
    // Query the API and throw if the response is not 200 (OK).
    const responseHeader = await fetch(url.href);
    if (responseHeader.status != 200) { throw ApiError.badRequest(); }
    return responseHeader.json();
  };

  try {
    return await makeRequest();
  }
  catch {
    // If resiliency is disabled, then just throw, don't try again.
    if (!resilient) { throw ApiError.unknownError(); }

    // Otherwise, wait a short interval and try again!
    await new Promise((resolve) => setTimeout(resolve, firstResiliencyInterval));

    try {
      return await makeRequest();
    }
    catch {
      // Third times a charm!
      await new Promise((resolve) => setTimeout(resolve, secondResiliencyInterval));

      try {
        return await makeRequest();
      }
      catch {
        // Failed all three times? Well we tried... Just throw.
        throw ApiError.unknownError();
      }
    }
  }
}

/** The error object used when an API call is made that goes wrong. */
export class ApiError extends Error {
  /**
   * Creates a {@link ApiError}.
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }

  /** Something went wrong. */
  static badRequest(): ApiError {
    return new ApiError(
      `Something went wrong.`
    );
  }

  /** Something went wrong. */
  static unknownError(): ApiError {
    return new ApiError(
      `Something went wrong.`
    );
  }
}
