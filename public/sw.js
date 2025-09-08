const CACHE_NAME = 'melody-player-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/metadata.json',
  
  // App code
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/services/audioService.ts',
  '/hooks/useAudioPlayback.tsx',
  '/hooks/useMediaSession.tsx',
  '/hooks/useUITimer.tsx',
  '/components/Visualizer.tsx',
  '/components/OnboardingScreen.tsx',
  '/components/LanguageModal.tsx',
  '/components/PlayerUI.tsx',
  '/components/MixerSheet.tsx',
  '/components/SleepTimerSheet.tsx',
  '/components/FeedbackModal.tsx',
  '/components/TypingBenefit.tsx',
  '/components/InstallPWAButton.tsx',
  '/components/CoachingOverlay.tsx',
  '/components/AriaLiveAnnouncer.tsx',

  // Fonts (Example: add your font files here in the future)
  // '/fonts/YourFont-Regular.woff2',

  // CDNs
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});