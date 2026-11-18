/// <reference lib="webworker" />
/**
 * Service worker (Workbox, injectManifest). Precaches the app shell; runtime-caches fonts and images;
 * serves the cached app for every in-app navigation and an offline page if even that is missing.
 * Never caches API, auth or Firestore traffic: Firestore keeps its own offline cache.
 */
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// In-app navigations get the cached shell. Firebase reserved paths (/__/auth/handler etc.) and files go to the network.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/'), { denylist: [/^\/__\//, /\/[^/?]+\.[a-z0-9]+$/i] }));

const sameOrigin = (url: URL) => url.origin === self.location.origin;

registerRoute(
  ({ request, url }) => sameOrigin(url) && request.destination === 'font',
  new CacheFirst({ cacheName: 'fonts', plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 365 * 24 * 3600 })] }),
);
registerRoute(
  ({ request, url }) => sameOrigin(url) && request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'images', plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 })] }),
);

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') return (await matchPrecache('/offline')) ?? Response.error();
  return Response.error();
});

// The page asks the waiting worker to take over when the user taps "Refresh".
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
