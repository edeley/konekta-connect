import { useState } from "react";
import { Car, Calendar, Clock, MapPin, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";

interface TechnicalVisitModalProps {
  providerId: string;
  providerName: string;
  open: boolean;
  onClose: () => void;
}

const STP_DISTRICTS = [
  "Água Grande",
  "Mé-Zóchi",
  "Cantagalo",
  "Lobata",
  "Lembá",
  "Caué",
  "Pagué (Príncipe)",
];

const CATEGORIES = [
  "Canalização & Encanamento",
  "Eletricidade & Instalações",
  "Pintura & Acabamentos",
  "Climatização & Frio",
  "Alvenaria & Construção",
  "Carpintaria & Marcenaria",
  "Limpeza & Higienização",
  "Mecânica & Auto",
  "Serviços Gerais & Manutenção",
];

export function TechnicalVisitModal({
  providerId,
  providerName,
  open,
  onClose,
}: TechnicalVisitModalProps) {
  const config = useStore((s) => s.config);
  const defaultFee = config.technicalVisitFee || 150;

  const [serviceTitle, setServiceTitle] = useState("Avaliação e diagnóstico técnico no terreno");
  const [category, setCategory] = useState("Canalização & Encanamento");
  const [district, setDistrict] = useState("Água Grande");
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
  );
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [visitFee, setVisitFee] = useState(String(defaultFee));

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceTitle.trim()) {
      toast.error("Insira o motivo ou título da visita técnica.");
      return;
    }
    const fee = Number(visitFee) >= 0 ? Number(visitFee) : defaultFee;

    const res = store.proposeTechnicalVisit({
      providerId,
      providerName,
      serviceTitle: serviceTitle.trim(),
      category,
      district,
      address: address.trim() || undefined,
      scheduledDate,
      scheduledTime,
      visitFee: fee,
    });

    if (res.ok) {
      toast.success("Proposta de Visita Enviada!", {
        description: `Proposta enviada ao cliente com taxa de deslocação de ${formatDb(fee)}.`,
      });
      onClose();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-emerald-600 px-5 py-4 text-white dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Propor Visita Técnica no Terreno</h3>
              <p className="text-xs text-emerald-100">
                Para situações onde o orçamento final exige diagnóstico presencial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
              Motivo / Título da Visita *
            </label>
            <input
              type="text"
              required
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="Ex: Inspeção de fuga de água embutida na parede"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Categoria do Serviço
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Distrito de Atendimento
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {STP_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Data Prevista *
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Horário Previsto *
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                Taxa de Deslocação (Db)
              </label>
              <input
                type="number"
                min={0}
                value={visitFee}
                onChange={(e) => setVisitFee(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Garantia KONEKTA no Terreno</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed">
              O cliente paga a taxa de deslocação que fica retida em custódia. No local, você lança
              o orçamento final que é validado em duas camadas com proteção antifraude.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow hover:bg-emerald-700"
            >
              Enviar Proposta de Visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
