import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, EmptyState } from "@/components/konekta/kit";
import { useStore, store } from "@/lib/store";
import { providers } from "@/lib/konekta-data";
import { formatDb } from "@/lib/catalog";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos · KONEKTA" },
      { name: "description", content: "Os prestadores que guardou para contratar mais rápido no KONEKTA." },
      { property: "og:title", content: "Favoritos · KONEKTA" },
      { property: "og:description", content: "Guarde profissionais de confiança e contrate em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const favorites = useStore((s) => s.favorites);
  const list = providers.filter((p) => favorites.includes(p.id));

  return (
    <AppShell hideFab>
      <ScreenHeader title="Favoritos" subtitle={`${list.length} prestador(es) guardado(s)`} />
      <Section>
        {list.length === 0 ? (
          <EmptyState
            icon={<Heart size={22} />}
            title="Ainda sem favoritos"
            description="Toque no coração no perfil de um prestador para o guardar aqui."
            action={
              <Link to="/" className="mt-2 text-sm font-semibold text-primary">
                Explorar prestadores
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <KCard key={p.id}>
                <div className="flex items-center gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="size-14 shrink-0 rounded-2xl object-cover"
                  />
                  <Link to="/prestador/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star size={12} className="fill-warning text-warning" /> {p.rating} · a partir de{" "}
                      {formatDb(p.priceFrom)}
                    </p>
                  </Link>
                  <button
                    type="button"
                    aria-label="Remover dos favoritos"
                    onClick={() => store.toggleFavorite(p.id)}
                    className="press grid size-10 shrink-0 place-items-center rounded-full bg-muted"
                  >
                    <Heart size={16} className="fill-destructive text-destructive" />
                  </button>
                </div>
              </KCard>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}
