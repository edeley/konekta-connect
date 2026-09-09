import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Receipt,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState, BottomSheet } from "@/components/konekta/kit";
import { Button } from "@/components/ui/button";
import { ProofUpload } from "@/components/konekta/ProofUpload";
import { store, useStore, type Order } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { timeAgo, urgencyLabel, type ServiceRequest } from "@/lib/requests";
import { orderStateMeta } from "@/lib/states";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/trabalhos")({
  head: () => ({
    meta: [
      { title: "Trabalhos publicados · KONEKTA Prestador" },
      {
        name: "description",
        content:
          "Aceite ou recuse pedidos publicados, defina o horário, confirme a presença e cobre o valor com comprovativo.",
      },
      { property: "og:title", content: "Trabalhos publicados · KONEKTA Prestador" },
      {
        property: "og:description",
        content: "Fluxo completo do prestador KONEKTA: aceitar, agendar, confirmar e cobrar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProJobsPage,
});

const activeStatuses = ["aceite", "a-caminho", "em-execucao", "aguardando-codigo"];

function ProJobsPage() {
  const requests = useStore((s) => s.requests);
  const orders = useStore((s) => s.orders);
  const profile = useStore((s) => s.providerProfile);
  const userId = useStore((s) => s.user?.id) ?? "me";

  const [tab, setTab] = useState<"publicados" | "meus">("publicados");
  const [onlyMine, setOnlyMine] = useState(true);

  const [accepting, setAccepting] = useState<ServiceRequest | null>(null);
  const [acceptPrice, setAcceptPrice] = useState("");
  const [acceptWhen, setAcceptWhen] = useState("");

  const [scheduling, setScheduling] = useState<Order | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");

  const [charging, setCharging] = useState<Order | null>(null);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");
  const [proof, setProof] = useState<string | undefined>();
  const [proofName, setProofName] = useState<string | undefined>();

  const published = useMemo(
    () =>
      requests
        .filter((r) => r.status === "aberto" && !r.isDirect)
        .filter((r) => (r.adminStatus ?? "aprovado") === "aprovado")
        .filter((r) => !(r.declinedBy ?? []).includes(userId))
        .filter((r) => !onlyMine || !profile?.category || r.categoryName === profile.category)
        .sort((a, b) => b.createdAt - a.createdAt),
    [requests, onlyMine, profile?.category, userId],
  );

  const myJobs = useMemo(
    () =>
      orders
        .filter((o) => activeStatuses.includes(o.status) || o.requestId)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [orders],
  );

  function confirmAccept() {
    if (!accepting) return;
    const res = store.providerAcceptRequest(accepting.id, {
      price: acceptPrice ? Number(acceptPrice) : undefined,
      scheduledFor: acceptWhen.trim() || undefined,
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setAccepting(null);
    setAcceptPrice("");
    setAcceptWhen("");
    setTab("meus");
  }

  function confirmSchedule() {
    if (!scheduling) return;
    const res = store.providerScheduleOrder(scheduling.id, scheduleValue);
    res.ok ? toast.success(res.message) : toast.error(res.message);
    if (res.ok) {
      setScheduling(null);
      setScheduleValue("");
    }
  }

  function confirmCharge() {
    if (!charging) return;
    const res = store.providerChargeOrder({
      orderId: charging.id,
      amount: Number(chargeAmount),
      proofImage: proof,
      proofFileName: proofName,
      note: chargeNote.trim() || undefined,
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setCharging(null);
    setChargeAmount("");
    setChargeNote("");
    setProof(undefined);
    setProofName(undefined);
  }

  return (
    <AppShell roles={["prestador"]} hideFab>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Trabalhos</h1>
        <p className="text-sm text-muted-foreground">
          Pedidos publicados pelos clientes e o seu fluxo de execução até à cobrança.
        </p>
      </header>

      <Section>
        <div className="flex gap-2">
          {(
            [
              { key: "publicados", label: `Publicados (${published.length})` },
              { key: "meus", label: `Meus trabalhos (${myJobs.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "press min-h-10 flex-1 rounded-full px-3 text-xs font-bold transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card text-muted-foreground shadow-soft hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      {tab === "publicados" && (
        <>
          {profile?.category && (
            <Section>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyMine(true)}
                  className={cn(
                    "press rounded-full px-3 py-1.5 text-xs font-semibold",
                    onlyMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {profile.category}
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyMine(false)}
                  className={cn(
                    "press rounded-full px-3 py-1.5 text-xs font-semibold",
                    !onlyMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  Todas as categorias
                </button>
              </div>
            </Section>
          )}

          <Section className="space-y-3 pb-10">
            {published.length === 0 ? (
              <EmptyState
                title="Nenhum pedido publicado disponível"
                description="Assim que a administração aprovar um novo pedido na sua área, ele aparece aqui."
              />
            ) : (
              published.map((r) => (
                <KCard key={r.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.id} · {r.categoryName} · {r.clientName} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <StatusPill tone={r.urgency === "urgente" ? "warning" : "primary"}>
                      {urgencyLabel[r.urgency]}
                    </StatusPill>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <MapPin size={12} /> {r.district}
                    </span>
                    {r.reference && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Navigation size={12} /> {r.reference}
                      </span>
                    )}
                    {r.scheduleSummary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                        <Calendar size={12} /> {r.scheduleSummary}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <Clock size={12} /> {r.proposals.length} proposta(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Valor indicado pelo cliente
                      </span>
                      <span className="font-mono text-base font-extrabold text-primary">
                        {r.budget ? formatDb(r.budget) : "A combinar"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = store.providerDeclineRequest(r.id);
                          res.ok ? toast(res.message) : toast.error(res.message);
                        }}
                        className="press flex h-11 items-center gap-1.5 rounded-xl bg-muted px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} /> Recusar
                      </button>
                      <Button
                        className="h-11 rounded-xl px-4 text-xs font-bold"
                        disabled={profile?.status !== "aprovado"}
                        onClick={() => {
                          setAccepting(r);
                          setAcceptPrice(r.budget ? String(r.budget) : "");
                          setAcceptWhen(r.scheduleSummary ?? "");
                        }}
                      >
                        <CheckCircle2 size={14} /> Aceitar
                      </Button>
                    </div>
                  </div>
                </KCard>
              ))
            )}
          </Section>
        </>
      )}

      {tab === "meus" && (
        <Section className="space-y-3 pb-10">
          {myJobs.length === 0 ? (
            <EmptyState
              title="Ainda não aceitou nenhum trabalho"
              description="Aceite um pedido publicado para começar o fluxo de execução."
            />
          ) : (
            myJobs.map((o) => {
              const meta = orderStateMeta[o.status];
              return (
                <KCard key={o.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{o.service}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {o.id} · {o.clientName ?? "Cliente"} · {o.scheduledFor}
                      </p>
                    </div>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </div>

                  <p className="text-xs text-muted-foreground">{meta.message}</p>

                  {o.charge && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Cobrança de {formatDb(o.charge.amount)} enviada com comprovativo
                      {o.charge.proofFileName ? ` (${o.charge.proofFileName})` : ""}.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">
                        Valor do serviço
                      </span>
                      <span className="font-mono text-base font-extrabold text-primary">
                        {formatDb(o.total)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/pedido/$id"
                        params={{ id: o.id }}
                        className="press flex h-10 items-center gap-1 rounded-full bg-muted px-3 text-xs font-bold text-foreground"
                      >
                        Detalhes <ChevronRight size={14} />
                      </Link>

                      {["aceite", "a-caminho"].includes(o.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduling(o);
                            setScheduleValue(o.scheduledFor ?? "");
                          }}
                          className="press flex h-10 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-bold"
                        >
                          <Calendar size={14} /> Definir horário
                        </button>
                      )}

                      {["aceite", "a-caminho"].includes(o.status) && (
                        <Button
                          className="h-10 rounded-full px-4 text-xs font-bold"
                          onClick={() => {
                            const res = store.providerConfirmPresence(o.id);
                            res.ok ? toast.success(res.message) : toast.error(res.message);
                          }}
                        >
                          <CheckCircle2 size={14} /> Confirmar presença
                        </Button>
                      )}

                      {o.status === "em-execucao" && (
                        <Button
                          className="h-10 rounded-full px-4 text-xs font-bold"
                          onClick={() => {
                            setCharging(o);
                            setChargeAmount(String(o.total ?? ""));
                          }}
                        >
                          <Receipt size={14} /> Cobrar valor
                        </Button>
                      )}
                    </div>
                  </div>
                </KCard>
              );
            })
          )}
        </Section>
      )}

      <BottomSheet
        open={!!accepting}
        onClose={() => setAccepting(null)}
        title="Aceitar pedido"
        description={accepting?.title}
      >
        <input
          value={acceptPrice}
          inputMode="numeric"
          onChange={(e) => setAcceptPrice(e.target.value.replace(/\D/g, ""))}
          placeholder="Valor acordado em Db"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <input
          value={acceptWhen}
          onChange={(e) => setAcceptWhen(e.target.value)}
          placeholder="Horário (ex: Quinta, 09:00)"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <Button
          className="h-12 w-full rounded-2xl text-base font-bold"
          disabled={!acceptPrice}
          onClick={confirmAccept}
        >
          Aceitar e abrir chat com o cliente
        </Button>
      </BottomSheet>

      <BottomSheet
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        title="Definir horário"
        description={scheduling?.service}
      >
        <input
          value={scheduleValue}
          onChange={(e) => setScheduleValue(e.target.value)}
          placeholder="Ex: Sexta, 14:00"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <Button
          className="h-12 w-full rounded-2xl text-base font-bold"
          disabled={!scheduleValue.trim()}
          onClick={confirmSchedule}
        >
          Confirmar horário com o cliente
        </Button>
      </BottomSheet>

      <BottomSheet
        open={!!charging}
        onClose={() => setCharging(null)}
        title="Cobrar valor do serviço"
        description="O comprovativo ou recibo é obrigatório."
      >
        <input
          value={chargeAmount}
          inputMode="numeric"
          onChange={(e) => setChargeAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="Valor cobrado em Db"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <textarea
          value={chargeNote}
          onChange={(e) => setChargeNote(e.target.value)}
          rows={3}
          placeholder="Nota para o cliente (material usado, garantia...)"
          className="w-full rounded-2xl bg-muted/60 p-4 text-sm outline-none ring-primary/30 focus:ring-2"
        />
        <ProofUpload
          value={proof}
          fileName={proofName}
          onChange={(v, n) => {
            setProof(v);
            setProofName(n);
          }}
          label="Comprovativo / Recibo do serviço *"
        />
        <Button
          className="h-12 w-full rounded-2xl text-base font-bold"
          disabled={!chargeAmount || !proof}
          onClick={confirmCharge}
        >
          Enviar cobrança ao cliente
        </Button>
      </BottomSheet>
    </AppShell>
  );
}
