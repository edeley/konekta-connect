import { useState } from "react";
import {
  Sparkles,
  Send,
  X,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { districts } from "@/lib/catalog";
import { store, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface RequestUnservedServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceName?: string;
  initialDistrict?: string;
}

export function RequestUnservedServiceModal({
  isOpen,
  onClose,
  initialServiceName = "",
  initialDistrict,
}: RequestUnservedServiceModalProps) {
  const currentUser = useStore((s) => s.user);

  const [serviceName, setServiceName] = useState(initialServiceName);
  const [district, setDistrict] = useState(initialDistrict || districts[0]);
  const [clientName, setClientName] = useState(currentUser?.name || "");
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || "");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"urgente" | "esta-semana" | "sem-pressa">("esta-semana");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    store.requestUnservedService({
      serviceName: serviceName.trim(),
      district,
      clientName: clientName.trim() || "Cliente KONEKTA",
      clientPhone: clientPhone.trim() || "+239 9944747",
      clientEmail: currentUser?.email,
      description: description.trim(),
      urgency,
    });

    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setServiceName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="bg-primary/10 border-b border-primary/20 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                Solicitar Nova Especialidade ou Serviço
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aviso direto à administração da KONEKTA STP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Pedido Enviado à Administração!</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                A nossa equipa recebeu o seu pedido para{" "}
                <span className="font-semibold text-foreground">"{serviceName}"</span> em{" "}
                <span className="font-semibold text-foreground">{district}</span>. Iremos recrutar e
                certificar um prestador idóneo e enviar-lhe-emos uma notificação na app assim que a
                categoria estiver ativa para fazer o seu pedido!
              </p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 text-xs text-muted-foreground text-left flex items-start gap-3 border border-border">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Compromisso KONEKTA:</strong> Nunca mostramos categorias sem técnicos ativos
                para garantir que nenhum cliente fica com pedidos esquecidos ou sem resposta.
              </span>
            </div>

            <Button onClick={handleClose} className="w-full mt-4 h-12 rounded-xl text-sm font-bold">
              Entendido
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Explicação da Regra */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Porquê este formulário?</strong> A KONEKTA só lista serviços que contam com
                prestadores ativos e verificados. Se procura um serviço novo, diga-nos: o
                Administrador irá procurar e credenciar um técnico para si!
              </p>
            </div>

            {/* Nome do Serviço */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Que serviço ou técnico procura? <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Marceneiro / Móveis, Técnico de TV Satélite, Serralheiro..."
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* Distrito */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Em que distrito de STP precisa do trabalho?
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-11 px-3.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Dados de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />O seu Nome
                </label>
                <input
                  type="text"
                  placeholder="O seu nome"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+239 99X XXXX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* Descrição do Trabalho */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Descreva brevemente o que precisa que seja feito
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Preciso de reparar as dobradiças e portas de madeira do roupeiro que não fecham bem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none"
              />
            </div>

            {/* Urgência */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Para quando precisa?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency("urgente")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    urgency === "urgente"
                      ? "bg-amber-500/15 border-amber-500 text-amber-600 font-bold"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  ⚡ Urgente
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("esta-semana")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    urgency === "esta-semana"
                      ? "bg-primary/15 border-primary text-primary font-bold"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  📅 Esta semana
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("sem-pressa")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    urgency === "sem-pressa"
                      ? "bg-blue-500/15 border-blue-500 text-blue-600 font-bold"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🕒 Sem pressa
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!serviceName.trim()}
                className="gap-2 rounded-xl h-11 px-5 font-bold shadow-soft"
              >
                <Send className="w-4 h-4" />
                Enviar ao Administrador
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
