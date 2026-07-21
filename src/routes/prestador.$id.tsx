import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star, Shield, CheckCircle2, Heart, MessageCircle, X, Calendar } from "lucide-react";
import { getProvider, providers } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/prestador/$id")({
  head: ({ params }) => {
    const p = getProvider(params.id);
    return {
      meta: [
        { title: p ? `${p.name} — ${p.category} · KONEKTA` : "Prestador · KONEKTA" },
        { name: "description", content: p?.bio ?? "Perfil de prestador de serviços na KONEKTA." },
        { property: "og:title", content: p ? `${p.name} · KONEKTA` : "Prestador · KONEKTA" },
        { property: "og:description", content: p?.bio ?? "Perfil de prestador na KONEKTA." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-xl font-semibold">Prestador não encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-terracotta font-medium">
          Voltar ao início
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <button onClick={reset} className="text-terracotta font-medium">
        Tentar novamente
      </button>
    </div>
  ),
  loader: ({ params }) => {
    const provider = getProvider(params.id);
    if (!provider) throw new Error("not found");
    return { provider };
  },
  component: ProviderPage,
});

const slots = ["Hoje, 15:00", "Hoje, 17:30", "Amanhã, 09:00", "Amanhã, 14:00"];

function ProviderPage() {
  const { provider } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const favorites = useStore((s) => s.favorites);
  const isFav = favorites.includes(provider.id);
  const [openBook, setOpenBook] = useState(false);
  const [service, setService] = useState(provider.services[0]);
  const [slot, setSlot] = useState(slots[0]);
  const [error, setError] = useState<string | null>(null);

  function handleBook() {
    setError(null);
    const balance = store.get().balance;
    if (balance < provider.priceFrom) {
      setError("Saldo insuficiente. Carregue a carteira.");
      return;
    }
    store.createOrder({
      providerId: provider.id,
      service,
      total: provider.priceFrom,
      scheduledFor: slot,
    });
    setOpenBook(false);
    navigate({ to: "/pedidos" });
  }

  return (
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-md bg-surface pb-32">
        <div className="relative">
          <img src={provider.image} alt={provider.name} className="w-full aspect-[4/3] object-cover" />
          <button
            onClick={() => router.history.back()}
            className="absolute top-4 left-4 size-10 rounded-full bg-card/90 backdrop-blur ring-1 ring-border flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => store.toggleFavorite(provider.id)}
            className="absolute top-4 right-4 size-10 rounded-full bg-card/90 backdrop-blur ring-1 ring-border flex items-center justify-center"
            aria-label="Favoritar"
          >
            <Heart size={18} className={isFav ? "fill-terracotta text-terracotta" : ""} />
          </button>
        </div>

        <div className="px-5 -mt-6 relative">
          <div className="bg-card rounded-2xl ring-1 ring-border p-5 space-y-4">
            <div>
              <p className="text-[11px] font-medium text-ocean uppercase tracking-wider">{provider.category}</p>
              <h1 className="text-xl font-semibold mt-1">{provider.name}</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Star size={14} className="fill-sun text-sun" />
                <span className="font-medium text-foreground">{provider.rating}</span>
                <span>· {provider.reviews} avaliações</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
          </div>
        </div>

        <section className="px-5 mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Serviços</h2>
          <div className="flex flex-wrap gap-2">
            {provider.services.map((s: string) => (
              <span key={s} className="px-3 py-1.5 bg-card ring-1 ring-border rounded-full text-sm">
                {s}
              </span>
            ))}
          </div>
        </section>

        <section className="px-5 mt-6">
          <div className="bg-ocean/10 rounded-2xl p-4 flex gap-3">
            <Shield size={20} className="text-ocean shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Pagamento protegido</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                O prestador só recebe após a sua confirmação.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Últimas avaliações</h2>
          {[
            { name: "Ana P.", text: "Muito profissional e pontual. Recomendo!", stars: 5 },
            { name: "Carlos M.", text: "Serviço rápido e limpo. Excelente.", stars: 5 },
          ].map((r) => (
            <div key={r.name} className="bg-card rounded-2xl ring-1 ring-border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.name}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} size={12} className="fill-sun text-sun" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">{r.text}</p>
            </div>
          ))}
        </section>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-xl font-semibold text-terracotta">{provider.priceFrom} STN</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/chat/$id"
                params={{ id: provider.id }}
                className="size-11 rounded-xl bg-muted grid place-items-center"
                aria-label="Mensagem"
              >
                <MessageCircle size={16} />
              </Link>
              <button
                onClick={() => setOpenBook(true)}
                className="bg-terracotta text-primary-foreground px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Criar pedido
              </button>
            </div>
          </div>
        </div>

        {openBook && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setOpenBook(false)}
          >
            <div
              className="w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Novo pedido</h3>
                <button onClick={() => setOpenBook(false)} className="size-8 rounded-full bg-muted grid place-items-center">
                  <X size={16} />
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Serviço</p>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setService(s)}
                      className={`px-3 py-1.5 rounded-full text-sm ring-1 ${
                        service === s
                          ? "bg-terracotta text-primary-foreground ring-transparent"
                          : "bg-card ring-border"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Horário</p>
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={`px-3 py-2 rounded-xl text-sm ring-1 flex items-center gap-2 ${
                        slot === s
                          ? "bg-cocoa text-primary-foreground ring-transparent"
                          : "bg-card ring-border"
                      }`}
                    >
                      <Calendar size={14} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-terracotta">{provider.priceFrom} STN</span>
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleBook}
                className="w-full bg-terracotta text-primary-foreground rounded-xl py-3 font-semibold text-sm"
              >
                Confirmar pedido
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                O valor fica retido e só é libertado ao prestador após a sua confirmação.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

void providers;
