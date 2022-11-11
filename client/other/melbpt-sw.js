importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/cache-"),
  new workbox.strategies.CacheFirst()
);

workbox.recipes.offlineFallback();
