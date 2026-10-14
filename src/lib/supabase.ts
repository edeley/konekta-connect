import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Obter variáveis de ambiente públicas do Vite ou fallback configurado
const DEFAULT_SUPABASE_URL = "https://yfaxyxgldqikimpswgld.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_KSqw4ybwFsnNnYk-X9N1-g_2OoDzL-y";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof window !== "undefined" && window.localStorage?.getItem("konekta_supabase_url")) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

/**
 * Cliente singleton do Supabase com inicialização segura e preguiçosa.
 * Se as variáveis ainda não tiverem sido configuradas no painel de Settings,
 * o cliente avisa graciosamente em vez de quebrar a aplicação.
 */
let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const currentUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof window !== "undefined" && window.localStorage?.getItem("konekta_supabase_url")) ||
    supabaseUrl;

  const currentAnonKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    supabaseAnonKey ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (currentUrl && currentAnonKey) {
    clientInstance = createClient(currentUrl, currentAnonKey, {
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
 * Permite definir e salvar o URL do Supabase localmente para conexões imediatas
 */
export function setSupabaseUrl(url: string): void {
  if (typeof window !== "undefined") {
    const trimmed = url.trim();
    if (trimmed) {
      window.localStorage.setItem("konekta_supabase_url", trimmed);
    } else {
      window.localStorage.removeItem("konekta_supabase_url");
    }
    clientInstance = null; // Reinicializa o cliente na próxima chamada
  }
}

/**
 * Informa se a conexão com o Supabase está ativa e configurada
 */
export function isSupabaseConfigured(): boolean {
  const currentUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof window !== "undefined" && window.localStorage?.getItem("konekta_supabase_url")) ||
    supabaseUrl;

  const currentKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    supabaseAnonKey ||
    DEFAULT_SUPABASE_ANON_KEY;

  return Boolean(currentUrl && currentKey);
}

export function getCurrentSupabaseUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  if (typeof window !== "undefined") {
    return window.localStorage?.getItem("konekta_supabase_url") || DEFAULT_SUPABASE_URL;
  }
  return DEFAULT_SUPABASE_URL;
}

/**
 * Instância exportada direta (para compatibilidade rápida em queries)
 */
export const supabase = getSupabase();
