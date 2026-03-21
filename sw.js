// ─── Holistic Vitality Service Worker ───────────────────────────────
// Handles background notifications for meditation & workout reminders

const CACHE_NAME = 'holistic-v1';
const NOTIF_CHECK_INTERVAL = 60 * 1000; // check every minute

// ── Install & Cache ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/index.html', '/manifest.json'])
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
  scheduleNextNotifications();
});

// ── Fetch (serve from cache when offline) ───────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Message from main app ────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFS') {
    scheduleNextNotifications();
  }
  if (e.data && e.data.type === 'TEST_NOTIF') {
    self.registration.showNotification('🧘 Holistic Vitality', {
      body: 'Notifications are working! You\'ll get reminders on time.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: '🌿 Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});

// ── Notification click ───────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      if (cls.length > 0) {
        cls[0].focus();
        cls[0].navigate('/');
      } else {
        clients.openWindow('/');
      }
    })
  );
});

// ── Scheduling Logic ─────────────────────────────────────────────────
function msUntilTime(targetH, targetM) {
  const now = new Date();
  const target = new Date();
  target.setHours(targetH, targetM, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // next day
  return target - now;
}

function scheduleNextNotifications() {
  // Meditation: 8:00 AM reminder (fires at 7:55 AM)
  const msMed = msUntilTime(7, 55);
  setTimeout(() => {
    self.registration.showNotification('🧘 Meditation in 5 minutes', {
      body: 'Your Morning Mindfulness session starts at 8:00 AM. Find a quiet spot.',
      icon: '/icon-192.png',
      tag: 'meditation-warn',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open', title: '🌿 Open App' },
        { action: 'snooze', title: '⏰ Snooze 5min' }
      ]
    });
    // Schedule the session-start notification
    setTimeout(() => {
      self.registration.showNotification('🌅 Meditation Starts Now!', {
        body: 'Morning Mindfulness 8:00 – 8:30 AM. Breathe, and be present.',
        icon: '/icon-192.png',
        tag: 'meditation-start',
        vibrate: [300, 100, 300],
        requireInteraction: true,
        actions: [
          { action: 'open', title: '▶️ Join Session' },
          { action: 'dismiss', title: 'Later' }
        ]
      });
      scheduleNextMeditation();
    }, 5 * 60 * 1000); // 5 min later = 8:00 AM
  }, msMed);

  // Workout: 4:25 PM reminder
  const msWork = msUntilTime(16, 25);
  setTimeout(() => {
    self.registration.showNotification('💪 Workout in 5 minutes', {
      body: 'Power HIIT starts at 4:30 PM. Warm up and get ready!',
      icon: '/icon-192.png',
      tag: 'workout-warn',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open', title: '🏋️ Open App' },
        { action: 'snooze', title: '⏰ Snooze 5min' }
      ]
    });
    setTimeout(() => {
      self.registration.showNotification('🔥 Workout Time!', {
        body: 'Power HIIT 4:30 – 5:30 PM. Push your limits today!',
        icon: '/icon-192.png',
        tag: 'workout-start',
        vibrate: [400, 100, 400],
        requireInteraction: true,
        actions: [
          { action: 'open', title: '▶️ Start Workout' },
          { action: 'dismiss', title: 'Later' }
        ]
      });
      scheduleNextWorkout();
    }, 5 * 60 * 1000);
  }, msWork);
}

function scheduleNextMeditation() {
  // Reschedule for tomorrow
  setTimeout(scheduleNextNotifications, msUntilTime(7, 54));
}
function scheduleNextWorkout() {
  setTimeout(scheduleNextNotifications, msUntilTime(16, 24));
}

// ── Periodic Sync (keep SW alive on Android) ────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-notifications') {
    e.waitUntil(scheduleNextNotifications());
  }
});
