// Minimal service worker: makes the page installable (required for the Android share sheet)
// and serves the shell offline. Bump CACHE with the page BUILD.
const CACHE = "skill-share-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "favicon.ico"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;  // GitHub API goes straight to network
  // network first, so a new BUILD shows up; cache when offline. Share-target query strings map to the shell.
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(url.search ? "./" : e.request, copy));
    return r;
  }).catch(() => caches.match(url.search ? "./" : e.request).then((r) => r || caches.match("./"))));
});
