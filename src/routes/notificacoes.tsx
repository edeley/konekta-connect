import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, EmptyState, StatusPill } from "@/components/konekta/kit";
import { useStore, store } from "@/lib/store";
import { timeAgo } from "@/lib/requests";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações · KONEKTA" },
      {
        name: "description",
        content: "Acompanhe propostas, pagamentos e atualizações dos seus pedidos KONEKTA.",
      },
      { property: "og:title", content: "Notificações · KONEKTA" },
      { property: "og:description", content: "Propostas, pagamentos e estados de pedidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

const toneMap = {
  info: "primary",
  primary: "primary",
  success: "success",
  warning: "warning",
  error: "error",
} as const;

function Notifications() {
  const notifications = useStore((s) => s.notifications);

  return (
    <AppShell hideFab>
      <ScreenHeader
        title="Notificações"
        right={
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Marcar tudo como lido"
              onClick={() => store.markNotificationsRead()}
              className="press grid size-10 place-items-center rounded-full bg-card shadow-soft"
            >
              <CheckCheck size={16} />
            </button>
            <button
              type="button"
              aria-label="Limpar notificações"
              onClick={() => store.clearNotifications()}
              className="press grid size-10 place-items-center rounded-full bg-card shadow-soft"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      />
      <Section>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={22} />}
            title="Sem notificações"
            description="Tudo em dia por aqui."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const body = (
                <KCard className={n.read ? "opacity-70" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    </div>
                    <StatusPill tone={toneMap[n.tone]}>{timeAgo(n.at)}</StatusPill>
                  </div>
                </KCard>
              );
              return n.link ? (
                <a key={n.id} href={n.link} className="block">
                  {body}
                </a>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })}
          </div>
        )}
      </Section>
    </AppShell>
  );
}
