import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { providers } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";

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
    d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function ChatPage() {
  const messages = useStore((s) => s.messages);
  const entries = Object.entries(messages)
    .map(([providerId, msgs]) => {
      const last = msgs[msgs.length - 1];
      const p = providers.find((pr) => pr.id === providerId);
      return { providerId, last, p };
    })
    .filter((e) => e.p && e.last)
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));

  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">Uma conversa por pedido</p>
      </header>

      <section className="px-4 space-y-2">
        {entries.length === 0 && (
          <div className="bg-card ring-1 ring-border rounded-2xl p-8 text-center">
            <p className="text-sm font-medium">Sem conversas</p>
            <p className="text-xs text-muted-foreground mt-1">Contrate um prestador para começar.</p>
          </div>
        )}
        {entries.map(({ providerId, last, p }) => (
          <Link
            key={providerId}
            to="/chat/$id"
            params={{ id: providerId }}
            className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-2xl p-3"
          >
            <img src={p!.image} alt={p!.name} className="size-12 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium text-sm">{p!.name}</p>
                <span className="text-[11px] text-muted-foreground">{formatTime(last!.at)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {last!.from === "me" ? "Você: " : ""}
                {last!.text}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
