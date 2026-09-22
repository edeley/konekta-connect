import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Obter variáveis de ambiente públicas do Vite
const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";

/**
 * Cliente singleton do Supabase com inicialização segura e preguiçosa.
 * Se as variáveis ainda não tiverem sido configuradas no painel de Settings,
 * o cliente avisa graciosamente em vez de quebrar a aplicação.
 */
let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  if (supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return clientInstance;
  }

  return null;
}

/**
 * Informa se a conexão com o Supabase está ativa e configurada
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Instância exportada direta (para compatibilidade rápida em queries)
 */
export const supabase = getSupabase();
