import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { providers } from "@/lib/konekta-data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat · KONEKTA" },
      { name: "description", content: "Converse com prestadores sobre os seus pedidos." },
    ],
  }),
  component: ChatPage,
});

const conversations = [
  { providerId: "edmilson-varela", last: "Estou a caminho. Chego em 15 minutos.", time: "14:32", unread: 2 },
  { providerId: "maria-santos", last: "Perfeito, até amanhã!", time: "12:04", unread: 0 },
  { providerId: "dercio-costa", last: "Obrigado pela avaliação 🙏", time: "Ontem", unread: 0 },
];

function ChatPage() {
  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">Uma conversa por pedido</p>
      </header>

      <section className="px-4 space-y-2">
        {conversations.map((c) => {
          const p = providers.find((pr) => pr.id === c.providerId);
          if (!p) return null;
          return (
            <button
              key={c.providerId}
              className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-2xl p-3 text-left"
            >
              <img src={p.image} alt={p.name} className="size-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-sm">{p.name}</p>
                  <span className="text-[11px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last}</p>
              </div>
              {c.unread > 0 && (
                <span className="size-5 rounded-full bg-terracotta text-primary-foreground text-[10px] font-bold grid place-items-center">
                  {c.unread}
                </span>
              )}
            </button>
          );
        })}
      </section>
    </AppShell>
  );
}
