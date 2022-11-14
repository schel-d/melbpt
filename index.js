import { main } from "./.out/server/main.js";

const options = process.argv.slice(2);
const offlineMode = options.includes("--offline");
const devMode = options.includes("--dev");

await main(offlineMode, devMode);
