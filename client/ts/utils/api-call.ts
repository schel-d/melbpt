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

/**
 * Calls the API and parses the JSON recieved. This function passes the current
 * transit network hash along with the request and updates the stored data if
 * the server replies with one with a different hash.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param path The API path, e.g. "line-details/v1".
 * @param params The url parameters, e.g. `{ id: "1" }` adds "?id=1" to the url.
 * @param schema The schema of the JSON the API returns (not including network).
 */
export async function callApi<T extends AnyZodObject>(origin: string,
  path: string, params: Record<string, string>, schema: T): Promise<z.infer<T>> {

  // Build the URL for the get request.
  const url = new URL(origin);
  url.pathname = path;
  url.searchParams.append("hash", getNetwork().hash);
  for (const param of Object.keys(params)) {
    url.searchParams.append(param, params[param]);
  }

  try {
    // Query the API and throw if the response is not 200 (OK).
    const responseHeader = await fetch(url.href);
    if (responseHeader.status != 200) { throw ApiError.badRequest(); }

    // Parse the JSON returned. Make sure the provided schema is not in strict
    // mode by calling strip() otherwise the presence of the "network" key will
    // cause it to throw.
    const responseJson = await responseHeader.json();
    const response = schema.strip().parse(responseJson);

    // If the API has data in the "network" key (instead of null), then the hash
    // we gave was stale and this is the updated data, so store it.
    const networkResponse = NetworkJson.parse(responseJson);
    if (networkResponse.network != null) {
      updateNetwork(networkResponse.network);
    }

    return response;
  }
  catch (e) {
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
 */
export async function callApiNoHash<T extends ZodType>(origin: string,
  path: string, params: Record<string, string>, schema: T): Promise<z.infer<T>> {

  // Build the URL for the get request.
  const url = new URL(origin);
  url.pathname = path;
  for (const param of Object.keys(params)) {
    url.searchParams.append(param, params[param]);
  }

  try {
    // Query the API and throw if the response is not 200 (OK).
    const responseHeader = await fetch(url.href);
    if (responseHeader.status != 200) { throw ApiError.badRequest(); }

    // Parse the JSON returned.
    const responseJson = await responseHeader.json();
    return schema.parse(responseJson);
  }
  catch (e) {
    throw ApiError.unknownError();
  }
}

/**
 * The error object used when an API call is made that goes wrong.
 */
export class ApiError extends Error {
  /**
   * Creates a {@link ApiError}.
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Something went wrong.
   */
  static badRequest(): ApiError {
    return new ApiError(
      `Something went wrong.`
    );
  }

  /**
   * Something went wrong.
   */
  static unknownError(): ApiError {
    return new ApiError(
      `Something went wrong.`
    );
  }
}
