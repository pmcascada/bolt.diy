/* Middleware do Vercel: o site só é servido a quem introduziu a palavra-passe de acesso.
   O cookie mya_acesso tem o token devolvido pelo Supabase (função site_login); aqui confirma-se
   que continua válido (site_token_ok) — deixa de o ser quando o gestor muda a palavra-passe.
   O endereço e a chave são os mesmos de config.js (chave pública "anon"). */
const SB_URL = 'https://trplojeozhlxkygguddc.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGxvamVvemhseGt5Z2d1ZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjcwMDQsImV4cCI6MjEwODEwMzAwNH0.BNWtrPqRnZ1-wuVU-jg_dh_uPHsFUXylr7M9R8_2lEc';
// Ficheiros sempre acessíveis: a própria página de acesso e o que ela (e o browser) precisa.
const OPEN = /^\/(acesso\.html|mudanca\.js|config\.js|icon[\w-]*\.(svg|png)|manifest\.webmanifest|favicon\.ico|robots\.txt)$/;
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

async function tokenOk(t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return false;
  const c = cache.get(t);
  if (c && Date.now() - c.at < CACHE_MS) return c.ok;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/site_token_ok`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ t }),
    });
    const ok = r.ok && (await r.json()) === true;
    cache.set(t, { ok, at: Date.now() });
    return ok;
  } catch {
    return c ? c.ok : false; // sem resposta do Supabase: usa a última verificação, se existir
  }
}

const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

/* Mudança de endereço: boltdiy-public.vercel.app → mysql-academy.vercel.app.
   Os dados guardados no browser (progresso, acesso ao site, sessão) pertencem a cada endereço. Por isso, no
   endereço antigo, as páginas devolvem uma página que os junta e os leva para o novo endereço no fragmento (#)
   do link — que nunca é enviado a nenhum servidor; o endereço novo grava-os (mudanca.js e acesso.html). */
const NEW_ORIGIN = 'https://mysql-academy.vercel.app';
const OLD_HOSTS = new Set(['boltdiy-public.vercel.app']);
const MOVE_HTML = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>MySQL Academy · Novo endereço</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px/1.6 system-ui,sans-serif;background:#f6f7f9;color:#0f172a;padding:16px}div{max-width:420px;text-align:center}a{color:#d06a00;font-weight:600}</style></head>
<body><div><p>A MySQL Academy mudou para <b>mysql-academy.vercel.app</b>.</p><p>A redirecionar… Se nada acontecer, <a id="go" href="${NEW_ORIGIN}/">abra o novo endereço</a>.</p></div>
<script>(function () {
  var d = { v: 1, h: location.hash || '' };
  try {
    d.s = localStorage.getItem('mysql-academy.v1');
    d.a = localStorage.getItem('mysql-academy.acesso') || (document.cookie.match(/(?:^|;\\s*)mya_acesso=([0-9a-f]{64})/) || [])[1] || '';
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-[a-z0-9]+-auth-token$/.test(k)) { d.sb = d.sb || {}; d.sb[k] = localStorage.getItem(k); } }
  } catch (e) { /* sem acesso ao armazenamento: muda só de endereço */ }
  var path = location.pathname === '/acesso.html' ? '/' : location.pathname;
  var to = '${NEW_ORIGIN}' + path + location.search + '#mudanca=' + encodeURIComponent(JSON.stringify(d));
  document.getElementById('go').href = to;
  location.replace(to);
})();</script></body></html>`;

export default async function middleware(request) {
  const url = new URL(request.url);
  const page = url.pathname === '/' || url.pathname.endsWith('.html') || (request.headers.get('accept') || '').includes('text/html');
  if (OLD_HOSTS.has(url.host)) {
    if (page) return new Response(MOVE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    return Response.redirect(NEW_ORIGIN + url.pathname + url.search, 308);
  }
  if (OPEN.test(url.pathname)) return next();
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)mya_acesso=([0-9a-f]{64})/);
  if (m && (await tokenOk(m[1]))) return next();
  if (page) return Response.redirect(new URL('/acesso.html', url), 302);
  return new Response('Acesso reservado.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
