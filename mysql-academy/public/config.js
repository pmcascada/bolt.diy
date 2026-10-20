/* Configuração da ligação ao Supabase.
   Preencha com os valores do seu projeto (Supabase → Project Settings → API):
     supabaseUrl      – "Project URL", ex.: https://abcdefghijkl.supabase.co
     supabaseAnonKey  – chave pública "anon" (ou "publishable"). É seguro publicá-la:
                        os dados são protegidos pelas regras de segurança (supabase/schema.sql).
   Com os campos vazios, a app usa o servidor local (npm start), se existir. */
window.APP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
