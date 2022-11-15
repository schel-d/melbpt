import { TransitNetwork } from "melbpt-utils";
import { AnyZodObject, z } from "zod";
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
 * Calls the API and parses the JSON recieved. By default this function also
 * passes the current transit network hash along with the request and updates
 * the stored data if the server replies with one with a different hash.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param path The API path, e.g. "line-details/v1".
 * @param params The url parameters, e.g. `{ id: "1" }` adds "?id=1" to the url.
 * @param schema The schema of the JSON the API returns (not including network).
 * @param ensureUpdatedNetwork Whether this API provides updated transit network
 * data (true by default).
 */
export async function callApi<T extends AnyZodObject>(
  origin: string, path: string, params: Record<string, string>, schema: T,
  ensureUpdatedNetwork = true): Promise<z.infer<T>> {

  // Build the URL for the get request.
  const url = new URL(origin);
  url.pathname = path;
  if (ensureUpdatedNetwork) {
    url.searchParams.append("hash", getNetwork().hash);
  }
  for (const param of Object.keys(params)) {
    url.searchParams.append(param, params[param]);
  }

  // Query the API and throw if the response is not 200 (OK).
  try {
    const responseHeader = await fetch(url.href);
    if (responseHeader.status != 200) { throw ApiError.badRequest(); }

    // Otherwise parse the JSON returned. If network information may also be
    // present in the response (anytime ensureUpdatedNetwork is present), then
    // make sure the provided schema is not is strict mode by calling strip().
    const responseJson = await responseHeader.json();
    const dataSchema = ensureUpdatedNetwork ? schema.strip() : schema;
    const response = dataSchema.parse(responseJson);

    // If ensureUpdatedNetwork is true, then check the response to see if network
    // information is present, and if it is, update the stored network info.
    if (ensureUpdatedNetwork) {
      const response = NetworkJson.parse(responseJson);
      if (response.network != null) {
        updateNetwork(response.network);
      }
    }

    return response;
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
