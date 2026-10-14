import { getSupabase, isSupabaseConfigured } from "./supabase";
import { store, type Order, type Transaction } from "./store";

/**
 * Módulo de Sincronização em Tempo Real com o Supabase.
 * Permite sincronizar os pedidos e transações entre o estado local e a nuvem.
 */

export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from("pedidos").upsert(
      {
        id: order.id,
        provider_id: order.providerId || null,
        service: order.service || "",
        category: order.category || null,
        scheduled_for: order.scheduledFor || "",
        status: order.status || "pendente",
        total: Number(order.total) || 0,
        address: order.address || null,
        district: order.district || "Água Grande",
        location: order.location || null,
        client_phone: order.clientPhone || null,
        client_name: order.clientName || "Cliente",
        client_avatar: order.clientAvatar || null,
        reference_point: order.referencePoint || null,
        notes: order.notes || null,
        payment_method: order.paymentMethod || "carteira",
        completion_code: order.completionCode || null,
        latitude: order.latitude || null,
        longitude: order.longitude || null,
        accuracy: order.accuracy || null,
        maps_url: order.mapsUrl || null,
        directions_url: order.directionsUrl || null,
        photos: order.photos || [],
        breakdown: order.breakdown || {},
        warranty: order.warranty || null,
        started_at: order.startedAt || null,
        finished_at: order.finishedAt || null,
        completed_at: order.completedAt || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.warn("[Supabase Sync] Falha ao sincronizar pedido:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[Supabase Sync] Erro inesperado:", err);
    return false;
  }
}

export async function syncTransactionToSupabase(tx: Transaction): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from("transacoes").upsert(
      {
        id: tx.id,
        kind: tx.kind,
        label: tx.label,
        amount: Number(tx.amount) || 0,
        at: tx.at || Date.now(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.warn("[Supabase Sync] Falha ao sincronizar transação:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[Supabase Sync] Erro inesperado:", err);
    return false;
  }
}

/**
 * Puxa pedidos recentes do Supabase para atualizar a store local
 */
export async function fetchRemoteOrders(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;

  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return;

    if (data.length > 0) {
      const currentState = store.getState();
      const localMap = new Map(currentState.orders.map((o) => [o.id, o]));

      for (const row of data) {
        if (!localMap.has(row.id)) {
          const newOrder: Order = {
            id: row.id,
            providerId: row.provider_id || "edmilson-varela",
            service: row.service,
            category: row.category,
            scheduledFor: row.scheduled_for || "A combinar",
            status: row.status as Order["status"],
            total: Number(row.total) || 0,
            address: row.address,
            district: row.district,
            location: row.location,
            clientPhone: row.client_phone,
            clientName: row.client_name,
            clientAvatar: row.client_avatar,
            referencePoint: row.reference_point,
            notes: row.notes,
            paymentMethod: row.payment_method,
            completionCode: row.completion_code,
            latitude: row.latitude,
            longitude: row.longitude,
            accuracy: row.accuracy,
            mapsUrl: row.maps_url,
            directionsUrl: row.directions_url,
            photos: row.photos,
            breakdown: row.breakdown,
            warranty: row.warranty,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            completedAt: row.completed_at,
            createdAt: new Date(row.created_at).getTime(),
          };
          currentState.orders.unshift(newOrder);
        }
      }
    }
  } catch (err) {
    console.warn("[Supabase Sync] Falha ao buscar pedidos remotos:", err);
  }
}

/**
 * Testa a conexão em tempo real com o Supabase e retorna o status
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não preenchidas no Settings.",
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { connected: false, message: "Não foi possível inicializar o cliente Supabase." };
  }

  try {
    const { count, error } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true });

    if (error) {
      // Se o erro for de tabela inexistente no schema cache do PostgREST
      if (
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("Could not find the table")
      ) {
        return {
          connected: true,
          message:
            "Conexão com o Supabase estabelecida com sucesso! Para começar a gravar dados, execute o script 'supabase-schema.sql' no SQL Editor do seu projeto Supabase.",
        };
      }
      return {
        connected: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }

    return {
      connected: true,
      message: `Conexão bem-sucedida! Banco de dados operacional (${count ?? 0} pedidos encontrados).`,
    };
  } catch (err) {
    return {
      connected: false,
      message: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
