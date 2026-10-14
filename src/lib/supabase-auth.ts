import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { store, type UserProfile } from "./store";

export interface SupabaseAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Cria ou formata um identificador de email válido para o Supabase Auth.
 * Se o utilizador fornecer apenas telefone (ex: +239 9944747), geramos
 * um email interno único e determinístico no domínio @konekta.st
 * para permitir autenticação via senha padrão do Supabase Auth.
 */
export function formatAuthEmail(input: { phone?: string; email?: string }): string {
  if (input.email && input.email.trim()) {
    return input.email.trim().toLowerCase();
  }
  if (input.phone) {
    const cleanDigits = input.phone.replace(/\D/g, "");
    return `user_${cleanDigits}@konekta.st`;
  }
  return `guest_${Date.now()}@konekta.st`;
}

/**
 * Registar um novo utilizador no Supabase Auth + Criar Perfil na tabela `profiles`
 */
export async function registerWithSupabase(params: {
  phone?: string;
  email?: string;
  password: string;
  name: string;
  role: "cliente" | "prestador" | "ambos";
  district?: string;
}): Promise<SupabaseAuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const authEmail = formatAuthEmail({ phone: params.phone, email: params.email });

  try {
    // 1. Criar utilizador no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: params.password,
      options: {
        data: {
          name: params.name,
          phone: params.phone || "",
          role: params.role,
          district: params.district || "Água Grande",
        },
      },
    });

    if (authError) {
      // Se o utilizador já existir no Auth, tentamos fazer login direto
      if (
        authError.message?.toLowerCase().includes("already registered") ||
        authError.status === 422
      ) {
        return loginWithSupabase({
          phone: params.phone,
          email: params.email,
          password: params.password,
        });
      }
      return { success: false, error: authError.message };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { success: false, error: "Não foi possível obter os dados de autenticação." };
    }

    // 2. Criar ou atualizar o registro na tabela `profiles` com o UUID real gerado pelo Auth
    const profilePayload = {
      id: authUser.id, // Chave estrangeira exata para auth.users.id
      phone: params.phone || authEmail,
      name: params.name,
      email: params.email || authEmail,
      role: params.role,
      district: params.district || "Água Grande",
      city: "São Tomé",
      wallet_balance: 0,
      rating: 5.0,
      completed_jobs: 0,
      is_verified: false,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, {
      onConflict: "id",
    });

    if (profileError) {
      console.warn("[Supabase Auth] Aviso ao criar perfil na tabela:", profileError.message);
    }

    // 3. Atualizar o estado local da app (Store)
    const localProfile: UserProfile = {
      name: params.name,
      phone: params.phone,
      email: params.email,
      role: params.role,
      district: params.district || "Água Grande",
      walletBalance: 0,
      rating: 5.0,
      completedJobs: 0,
      isVerified: false,
    };
    store.setUser(localProfile);

    return { success: true, user: authUser };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Iniciar sessão no Supabase Auth + Obter Perfil
 */
export async function loginWithSupabase(params: {
  phone?: string;
  email?: string;
  password: string;
}): Promise<SupabaseAuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const authEmail = formatAuthEmail({ phone: params.phone, email: params.email });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: params.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const authUser = data.user;
    if (!authUser) {
      return { success: false, error: "Sessão não pôde ser iniciada." };
    }

    // Buscar perfil vinculado na tabela `profiles`
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    const role = (profileData?.role ||
      authUser.user_metadata?.role ||
      "cliente") as UserProfile["role"];
    const name = profileData?.name || authUser.user_metadata?.name || authEmail.split("@")[0];
    const phone = profileData?.phone || authUser.user_metadata?.phone || params.phone;
    const district = profileData?.district || authUser.user_metadata?.district || "Água Grande";
    const walletBalance = Number(profileData?.wallet_balance) || 0;

    const localProfile: UserProfile = {
      name,
      phone,
      email: params.email || authEmail,
      role,
      district,
      walletBalance,
      rating: Number(profileData?.rating) || 5.0,
      completedJobs: Number(profileData?.completed_jobs) || 0,
      isVerified: Boolean(profileData?.is_verified),
    };
    store.setUser(localProfile);

    return { success: true, user: authUser };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Terminar sessão no Supabase Auth
 */
export async function logoutWithSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignora falhas de rede no logout
    }
  }
  store.logout();
}

/**
 * Inicializar e restaurar a sessão ativa do Supabase ao abrir a app
 */
export async function restoreSupabaseSession(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const authUser = data.session.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        store.setUser({
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          role: profile.role,
          district: profile.district,
          walletBalance: Number(profile.wallet_balance) || 0,
          rating: Number(profile.rating) || 5.0,
          completedJobs: Number(profile.completed_jobs) || 0,
          isVerified: Boolean(profile.is_verified),
        });
      }
    }
  } catch {
    // Modo offline resiliente
  }
}
