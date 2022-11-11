importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/cache-"),
  new workbox.strategies.StaleWhileRevalidate()
);
