/* Mudança de endereço (boltdiy-public.vercel.app → mysql-academy.vercel.app): o endereço antigo envia,
   no fragmento #mudanca=… do link, o que estava guardado no browser — progresso, acesso ao site e sessão.
   Este script corre antes de todos os outros, grava esses dados neste endereço e limpa o link.
   Nunca substitui dados que já existam aqui. */
(function () {
  var m = /^#mudanca=(.*)$/.exec(location.hash);
  if (!m) return;
  var d = null;
  try { d = JSON.parse(decodeURIComponent(m[1])); } catch (e) { /* link incompleto: ignora */ }
  try {
    if (d && d.s && !localStorage.getItem('mysql-academy.v1')) localStorage.setItem('mysql-academy.v1', d.s);
    if (d && d.a && /^[0-9a-f]{64}$/.test(d.a) && !localStorage.getItem('mysql-academy.acesso')) localStorage.setItem('mysql-academy.acesso', d.a);
    if (d && d.sb) for (var k in d.sb) if (/^sb-[a-z0-9]+-auth-token$/.test(k) && !localStorage.getItem(k)) localStorage.setItem(k, d.sb[k]);
  } catch (e) { /* sem armazenamento */ }
  // repõe o fragmento original (ex.: link de confirmação de conta) ou limpa-o
  history.replaceState(null, '', location.pathname + location.search + ((d && d.h) || ''));
})();
