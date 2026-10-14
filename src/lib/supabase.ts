import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";

/**
 * Ligação à nuvem KONEKTA.
 *
 * A base de dados é gerida pelo Lovable Cloud: o cliente é gerado
 * automaticamente e lê VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
 * Este módulo mantém a API antiga da app (getSupabase, isSupabaseConfigured,
 * ...) por cima desse cliente, para que a autenticação, a sincronização e as
 * definições continuem a funcionar sem alterações.
 */

function readEnv(name: string): string {
  try {
    const viteValue =
      typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env as Record<string, string | undefined>)[name]
        : undefined;
    if (viteValue) return viteValue;
  } catch {
    // import.meta indisponível
  }

  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[name] || "";
    }
  } catch {
    // process indisponível no browser
  }

  return "";
}

const CLOUD_URL = readEnv("VITE_SUPABASE_URL") || readEnv("SUPABASE_URL");
const CLOUD_KEY = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") || readEnv("SUPABASE_PUBLISHABLE_KEY");

/**
 * Informa se a ligação à nuvem está ativa e configurada
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(CLOUD_URL && CLOUD_KEY);
}

/**
 * URL da base de dados em uso (gerida pelo Lovable Cloud)
 */
export function getCurrentSupabaseUrl(): string {
  return CLOUD_URL;
}

/**
 * Cliente singleton da nuvem. Devolve null apenas quando a ligação
 * ainda não está configurada, para que a app continue em modo offline.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return cloudSupabase as unknown as SupabaseClient;
}

/**
 * Mantido por compatibilidade com o ecrã de definições.
 * A base de dados é a do Lovable Cloud, por isso definir um URL próprio
 * deixa de alterar o destino dos dados.
 */
export function setSupabaseUrl(_url: string): void {
  // Sem efeito: a app usa exclusivamente a ligação gerida pelo Lovable Cloud.
}

/**
 * Instância exportada direta (para compatibilidade rápida em queries)
 */
export const supabase = getSupabase();
