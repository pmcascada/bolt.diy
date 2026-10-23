/* Service worker: a app funciona offline depois da primeira visita. */
const V = 'mya-v23';
const CORE = ['./', 'index.html', 'styles.css', 'config.js', 'app.js', 'content.js', 'score.js', 'game/levels.js', 'db.js', 'ddl.js', 'backend.js', 'vendor/alasql.min.js', 'vendor/supabase.js', 'manifest.webmanifest', 'icon.svg', 'icon-mark.svg', 'icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  // rede primeiro (conteúdo atualizado), cache como reserva offline
  // (só se guardam respostas válidas: um "acesso reservado" nunca fica em cache)
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(V).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
