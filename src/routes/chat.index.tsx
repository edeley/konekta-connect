import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { providers } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";
import { realtimeBus } from "@/lib/realtime";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "Conversas · KONEKTA" },
      { name: "description", content: "Converse com prestadores sobre os seus pedidos." },
      { property: "og:title", content: "Conversas · KONEKTA" },
      { property: "og:description", content: "Uma conversa por pedido, dentro da plataforma." },
    ],
  }),
  component: ChatPage,
});

function formatTime(at: number) {
  const d = new Date(at);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function ChatPage() {
  const messages = useStore((s) => s.messages);
  const orders = useStore((s) => s.orders);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = realtimeBus.subscribeTyping(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const allEntries = Object.entries(messages)
    .map(([providerId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const p = providers.find((pr) => pr.id === providerId);
      const isTyping = realtimeBus.getTyping(providerId);
      const providerOrders = orders.filter((o) => o.providerId === providerId);
      const hasActiveOrder =
        providerOrders.length === 0 ||
        providerOrders.some((o) =>
          ["pendente", "aceite", "a-caminho", "em-execucao"].includes(o.status),
        );
      const isCompleted =
        providerOrders.length > 0 &&
        providerOrders.every((o) => ["concluido", "avaliado"].includes(o.status));
      return { providerId, last, p, isTyping, hasActiveOrder, isCompleted };
    })
    .filter((e) => e.p && e.last)
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));

  const activeEntries = allEntries.filter((e) => !e.isCompleted);
  const completedEntries = allEntries.filter((e) => e.isCompleted);

  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comunicação direta em tempo real para pedidos a decorrer
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Em direto
        </span>
      </header>

      <section className="px-4 space-y-4 pb-12">
        {allEntries.length === 0 && (
          <div className="bg-card ring-1 ring-border rounded-2xl p-8 text-center">
            <p className="text-sm font-medium">Sem conversas ativas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contrate um prestador ou inicie um pedido para começar.
            </p>
          </div>
        )}

        {/* Conversas Ativas dos Pedidos a Decorrer */}
        {activeEntries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-foreground">Pedidos a Decorrer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {activeEntries.length} ativo{activeEntries.length > 1 ? "s" : ""}
              </span>
            </div>

            {activeEntries.map(({ providerId, last, p, isTyping }) => (
              <Link
                key={providerId}
                to="/chat/$id"
                params={{ id: providerId }}
                className="w-full flex items-center gap-3 bg-card border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-3 hover:bg-muted/40 transition shadow-2xs"
              >
                <div className="relative">
                  <img src={p!.image} alt={p!.name} className="size-12 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-sm text-foreground">{p!.name}</p>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatTime(last!.at)}
                    </span>
                  </div>
                  {isTyping ? (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5 animate-pulse">
                      A escrever...
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {last!.from === "me" ? "Você: " : ""}
                      {last!.text}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Conversas de Pedidos Concluídos / Encerrados */}
        {completedEntries.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Pedidos Finalizados (Chat Encerrado)
              </span>
            </div>

            {completedEntries.map(({ providerId, last, p }) => (
              <div
                key={providerId}
                className="w-full flex items-center gap-3 bg-muted/40 rounded-2xl p-3 opacity-75 border border-border/40"
              >
                <img
                  src={p!.image}
                  alt={p!.name}
                  className="size-10 rounded-full object-cover grayscale"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-xs text-muted-foreground">{p!.name}</p>
                    <span className="text-[10px] text-muted-foreground">Concluído</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    🔒 Pedido finalizado · Chat encerrado
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
