// choose files to be cached
const FILE_TO_CACHED = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/db.js',
    '/assets/js/index.js',
    '/manifest.json',
    "/assets/images/icons/icon_192x192.png",
    "/assets/images/icons/icon_512x512.png",
    'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
];

const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// install - pre-cache the files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
        .open(PRECACHE)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
        caches
        .keys()
        .then((cacheNames) => {
            return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
        })
        .then((cachesToDelete) => {
            return Promise.all(
                cachesToDelete.map((cacheToDelete) => {
                    return caches.delete(cacheToDelete);
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // POST requests are not cached 
    if (event.request.method !== "GET") {
        event.respondWith(fetch(event.request)
            .then(response => {
                return response;
            }).catch(err => {
                console.log(err);
                return err;
            }));
        // return;
    } else if (event.request.url) {
        // cache GET requests, including outside resources like font-awesome and chart.js
        event.respondWith(
            caches.open(RUNTIME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }
});