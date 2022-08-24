import got from "got";
import { z } from "zod";

/**
 * The URL of the network API.
 */
const apiPath = "/network/v1";

/**
 * The Zod schema to parse the json for each stop in the network.
 */
const StopJson = z.object({
  id: z.number().int(),
  name: z.string(),
  platforms: z.object({
    id: z.string(),
    name: z.string()
  }).array(),
  tags: z.string().array(),
  urlName: z.string()
});

/**
 * The Zod schema to parse the json for each line in the network.
 */
const LineJson = z.object({
  id: z.number().int(),
  name: z.string(),
  color: z.enum(
    ["red", "yellow", "green", "cyan", "blue", "purple", "pink", "grey"]
  ),
  service: z.enum(["suburban", "regional"]),
  routeType: z.enum(["linear", "city-loop", "branch"]),
  tags: z.string().array(),
  routeLoopPortal: z.enum(
    ["richmond", "jolimont", "north-melbourne"]
  ).optional(),

  directions: z.object({
    id: z.string(),
    name: z.string(),
    stops: z.number().int().array()
  }).array()
});

/**
 * The Zod schema to parse the network json returned from the API.
 */
const NetworkJson = z.object({
  hash: z.string(),
  stops: StopJson.array(),
  lines: LineJson.array(),
});

/**
 * Data associated with the lines and stops in the network.
 */
export type Network = z.infer<typeof NetworkJson>;

/**
 * Data associated with a particular stop in the network.
 */
export type Stop = z.infer<typeof StopJson>;

/**
 * Data associated with a particular line in the network.
 */
export type Line = z.infer<typeof LineJson>;

/**
 * Downloads and returns the network object from the server. Throws an error
 * if something goes wrong.
 */
export async function fetchNetwork(apiDomain: string): Promise<Network> {
  const json = await got.get(apiDomain + apiPath).json();
  const network = NetworkJson.parse(json);
  return network;
}
