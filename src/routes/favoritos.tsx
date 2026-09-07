import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart,
  Star,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  UserCheck,
  Calendar,
  Briefcase,
  ExternalLink,
  Lock,
  ShieldCheck,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader, Section, KCard, EmptyState, BottomSheet } from "@/components/konekta/kit";
import { useStore, store, type FavoriteClient } from "@/lib/store";
import { providers } from "@/lib/konekta-data";
import { formatDb } from "@/lib/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos · KONEKTA STP" },
      {
        name: "description",
        content:
          "Gestão de favoritos no KONEKTA: prestadores de confiança para clientes e clientes preferenciais para prestadores.",
      },
      { property: "og:title", content: "Favoritos · KONEKTA STP" },
      {
        property: "og:description",
        content: "Aceda aos seus contactos e profissionais de eleição com rapidez.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const user = useStore((s) => s.user);
  const isProvider = user?.role === "prestador";

  // Abas para quem tem perfil duplo ou quer alternar visualização
  const [viewMode, setViewMode] = useState<"clientes" | "prestadores">(
    isProvider ? "clientes" : "prestadores",
  );

  const favorites = useStore((s) => s.favorites);
  const favoriteClients = useStore((s) => s.favoriteClients);
  const orders = useStore((s) => s.orders);

  // Modal para adicionar cliente aos favoritos
  const [openAddClientModal, setOpenAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDistrict, setNewClientDistrict] = useState("Água Grande");
  const [newClientNotes, setNewClientNotes] = useState("");

  const favoriteProvidersList = providers.filter((p) => favorites.includes(p.id));

  // Clientes de pedidos anteriores disponíveis para favoritar rapidamente (sem dados de contacto expostos)
  const pastClientCandidates = orders
    .filter((o) => o.clientName && !favoriteClients.some((fc) => fc.name === o.clientName))
    .map((o) => ({
      name: o.clientName || "Cliente KONEKTA",
      district: o.district || "Água Grande",
      service: o.service,
    }));

  function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast.error("Por favor insira o nome do cliente");
      return;
    }

    const newFav: FavoriteClient = {
      id: `fc_${Date.now()}`,
      name: newClientName.trim(),
      phone: "Contacto Protegido KONEKTA",
      district: newClientDistrict,
      notes: newClientNotes.trim() || "Cliente adicionado aos favoritos",
      totalServices: 1,
      totalSpentSTN: 500,
      rating: 5.0,
      lastHiredDate: "Hoje",
    };

    store.toggleFavoriteClient(newFav);
    setOpenAddClientModal(false);
    setNewClientName("");
    setNewClientNotes("");
    toast.success(`${newFav.name} adicionado aos seus Clientes Favoritos!`);
  }

  function handleQuickAddPastClient(client: { name: string; district: string }) {
    const newFav: FavoriteClient = {
      id: `fc_${Date.now()}`,
      name: client.name,
      phone: "Contacto Protegido KONEKTA",
      district: client.district,
      notes: "Cliente habitual de serviços KONEKTA",
      totalServices: 2,
      totalSpentSTN: 1100,
      rating: 5.0,
      lastHiredDate: "Serviço recente",
    };
    store.toggleFavoriteClient(newFav);
    toast.success(`${client.name} adicionado aos seus Clientes Favoritos!`);
  }

  return (
    <AppShell hideFab>
      <ScreenHeader
        title="Favoritos"
        subtitle={
          viewMode === "clientes"
            ? `${favoriteClients.length} cliente(s) habitual(is) guardado(s)`
            : `${favoriteProvidersList.length} prestador(es) guardado(s)`
        }
      />

      {/* SELETOR DE ABA (CLIENTES FAVORITOS vs PRESTADORES FAVORITOS) */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/70 border border-border/40 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode("clientes")}
            className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === "clientes"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck size={14} />
            <span>Clientes Favoritos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-bold">
              {favoriteClients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("prestadores")}
            className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === "prestadores"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart size={14} />
            <span>Prestadores Favoritos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-bold">
              {favoriteProvidersList.length}
            </span>
          </button>
        </div>
      </div>

      <Section>
        {/* ========================================================================= */}
        {/* ABA: CLIENTES FAVORITOS (PARA PRESTADORES) */}
        {/* ========================================================================= */}
        {viewMode === "clientes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Os Seus Clientes Preferenciais
                </h3>
                <p className="text-xs text-muted-foreground">
                  Clientes com quem trabalha com frequência e confiança em São Tomé.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenAddClientModal(true)}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={14} />
                <span>Adicionar</span>
              </button>
            </div>

            {favoriteClients.length === 0 ? (
              <EmptyState
                icon={<UserCheck size={24} className="text-primary" />}
                title="Ainda sem clientes favoritos"
                description="Guarde os clientes com quem tem boa relação para contactar e passar orçamentos com facilidade."
                action={
                  <button
                    type="button"
                    onClick={() => setOpenAddClientModal(true)}
                    className="mt-2 text-sm font-semibold text-primary"
                  >
                    + Adicionar o primeiro cliente
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {favoriteClients.map((client) => (
                  <KCard key={client.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-primary/10 text-primary font-black text-sm grid place-items-center shrink-0 border border-primary/20">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground leading-tight">
                            {client.name}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-primary" />
                            <span>{client.district}</span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {client.totalServices} serviços concluídos
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          store.removeFavoriteClient(client.id);
                          toast.info(`${client.name} removido dos favoritos`);
                        }}
                        aria-label="Remover dos favoritos"
                        title="Remover cliente"
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {client.notes && (
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/40 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground mr-1">Nota:</span>
                        {client.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-500" />
                        <span>{client.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground font-normal ml-1">
                          · {client.totalSpentSTN.toLocaleString()} STN faturados
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl border border-border/40 flex items-center gap-1.5">
                          <Lock size={11} className="text-primary" />
                          <span>Contacto Blindado</span>
                        </span>
                        <Link
                          to="/pro/oportunidades"
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition"
                        >
                          <Send size={12} />
                          <span>Propor Serviço</span>
                        </Link>
                      </div>
                    </div>
                  </KCard>
                ))}
              </div>
            )}

            {/* SUGESTÕES DE CLIENTES DE PEDIDOS ANTERIORES */}
            {pastClientCandidates.length > 0 && (
              <div className="pt-3 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Adicionar de Pedidos Concluídos
                </h4>
                <div className="space-y-2">
                  {pastClientCandidates.slice(0, 2).map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{cand.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {cand.service} · {cand.district}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickAddPastClient(cand)}
                        className="px-3 py-1.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground font-bold transition flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Favoritar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA: PRESTADORES FAVORITOS (PARA CLIENTES) */}
        {/* ========================================================================= */}
        {viewMode === "prestadores" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Profissionais de Confiança</h3>
              <p className="text-xs text-muted-foreground">
                Prestadores guardados para contratar com rapidez em São Tomé e Príncipe.
              </p>
            </div>

            {favoriteProvidersList.length === 0 ? (
              <EmptyState
                icon={<Heart size={24} className="text-destructive" />}
                title="Ainda sem prestadores favoritos"
                description="Toque no ícone de coração no perfil de um prestador para o guardar aqui."
                action={
                  <Link to="/" className="mt-2 text-sm font-semibold text-primary">
                    Explorar prestadores em São Tomé
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {favoriteProvidersList.map((p) => (
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
                          <Star size={12} className="fill-amber-500 text-amber-500" /> {p.rating} ·
                          a partir de {formatDb(p.priceFrom)}
                        </p>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          to="/prestador/$id"
                          params={{ id: p.id }}
                          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs"
                        >
                          Chamar
                        </Link>
                        <button
                          type="button"
                          aria-label="Remover dos favoritos"
                          onClick={() => {
                            store.toggleFavorite(p.id);
                            toast.info(`${p.name} removido dos favoritos`);
                          }}
                          className="press grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-destructive hover:bg-destructive/10 transition"
                        >
                          <Heart size={16} className="fill-destructive text-destructive" />
                        </button>
                      </div>
                    </div>
                  </KCard>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* BOTTOM SHEET: ADICIONAR NOVO CLIENTE AOS FAVORITOS */}
      <BottomSheet
        open={openAddClientModal}
        onClose={() => setOpenAddClientModal(false)}
        title="Adicionar Cliente Favorito"
        description="Registe um cliente habitual para contacto e orçamentos diretos"
      >
        <form onSubmit={handleAddClient} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Nome Completo do Cliente *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dra. Maria Sacramento"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/25 flex items-start gap-2.5 text-xs text-foreground">
            <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Contacto Blindado KONEKTA</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                Por proteção de custódia e garantia de serviço, nenhum número pessoal fica exposto. Todas as propostas e conversas são asseguradas internamente.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Distrito / Localidade</label>
            <select
              value={newClientDistrict}
              onChange={(e) => setNewClientDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Água Grande">Água Grande (Cidade Capital)</option>
              <option value="Mé-Zóchi">Mé-Zóchi (Trindade)</option>
              <option value="Cantagalo">Cantagalo (Santana)</option>
              <option value="Lobata">Lobata (Guadalupe)</option>
              <option value="Lembá">Lembá (Neves)</option>
              <option value="Caué">Caué (São João dos Angolares)</option>
              <option value="Região Autónoma do Príncipe">Região Autónoma do Príncipe</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Notas Privadas do Prestador</label>
            <textarea
              rows={2}
              placeholder="Ex: Cliente VIP, serviços de canalização, pagamento imediato."
              value={newClientNotes}
              onChange={(e) => setNewClientNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition shadow-sm"
            >
              Guardar Cliente Favorito
            </button>
            <button
              type="button"
              onClick={() => setOpenAddClientModal(false)}
              className="px-4 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
