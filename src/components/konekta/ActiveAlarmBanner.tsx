import { Bell, Clock, MapPin, X, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ActiveAlarmInfo } from "@/lib/useAlarmScheduler";

interface ActiveAlarmBannerProps {
  alarmInfo: ActiveAlarmInfo | null;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function ActiveAlarmBanner({ alarmInfo, onDismiss, onSnooze }: ActiveAlarmBannerProps) {
  if (!alarmInfo) return null;

  const { order, timeRemainingMinutes } = alarmInfo;

  return (
    <div className="fixed inset-x-4 top-4 z-50 max-w-md mx-auto animate-in slide-in-from-top-6 duration-300">
      <div className="rounded-3xl bg-slate-950 text-white p-5 shadow-2xl border-2 border-amber-500/80 ring-4 ring-amber-500/20 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500 text-slate-950 grid place-items-center animate-bounce shadow-md">
              <Bell size={22} className="fill-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                ALARME DE SERVIÇO KONEKTA
              </span>
              <h4 className="text-base font-bold text-white leading-tight">{order.service}</h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dispensar"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Clock size={14} className="text-amber-400" />
            <span>
              {timeRemainingMinutes <= 0
                ? "O serviço está a começar agora!"
                : `Faltam cerca de ${timeRemainingMinutes} minuto(s)`}
            </span>
          </div>
          {order.district && (
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <MapPin size={13} />
              <span>
                {order.address ? `${order.address}, ` : ""}
                {order.district}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition text-center shadow-xs"
          >
            Desligar Alarme
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
          >
            Soneca (5 min)
          </button>
          <Link
            to="/pedidos"
            onClick={onDismiss}
            className="py-2.5 px-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition flex items-center gap-1"
          >
            <span>Ver Pedido</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
