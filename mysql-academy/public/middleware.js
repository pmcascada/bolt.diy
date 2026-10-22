/* Middleware do Vercel: o site só é servido a quem introduziu a palavra-passe de acesso.
   O cookie mya_acesso tem o token devolvido pelo Supabase (função site_login); aqui confirma-se
   que continua válido (site_token_ok) — deixa de o ser quando o gestor muda a palavra-passe.
   O endereço e a chave são os mesmos de config.js (chave pública "anon"). */
const SB_URL = 'https://trplojeozhlxkygguddc.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGxvamVvemhseGt5Z2d1ZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjcwMDQsImV4cCI6MjEwODEwMzAwNH0.BNWtrPqRnZ1-wuVU-jg_dh_uPHsFUXylr7M9R8_2lEc';
// Ficheiros sempre acessíveis: a própria página de acesso e o que ela (e o browser) precisa.
const OPEN = /^\/(acesso\.html|config\.js|icon[\w-]*\.(svg|png)|manifest\.webmanifest|favicon\.ico|robots\.txt)$/;
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

export default async function middleware(request) {
  const url = new URL(request.url);
  if (OPEN.test(url.pathname)) return next();
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)mya_acesso=([0-9a-f]{64})/);
  if (m && (await tokenOk(m[1]))) return next();
  const page = url.pathname === '/' || url.pathname.endsWith('.html') || (request.headers.get('accept') || '').includes('text/html');
  if (page) return Response.redirect(new URL('/acesso.html', url), 302);
  return new Response('Acesso reservado.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
