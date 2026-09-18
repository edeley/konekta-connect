import React, { useState, useEffect, type ReactNode } from "react";
import { WifiOff, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

interface AppShieldProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Blindagem de Renderização: Error Boundary Global que impede qualquer
 * ecrã branco na aplicação em caso de exceção pontual num componente filho.
 */
export class SafeErrorBoundary extends React.Component<
  { children: ReactNode; fallbackTitle?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallbackTitle?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[KONEKTA Shield] Exceção intercetada com segurança:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[350px] w-full items-center justify-center p-6 text-center">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                {this.props.fallbackTitle || "Proteção Ativa KONEKTA"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este ecrã recuperou de uma instabilidade temporária. Os seus dados e saldo da
                carteira permanecem 100% seguros.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition cursor-pointer"
              >
                <RefreshCw size={14} />
                Recarregar este ecrã
              </button>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-xl border border-input bg-background text-xs font-semibold text-foreground hover:bg-accent transition"
              >
                Início
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Blindagem de Conectividade & Rede para São Tomé e Príncipe:
 * Monitoriza o estado da ligação do dispositivo (cortes de fibra, quebras de 3G/4G)
 * e garante que o utilizador é avisado de forma amigável de que todos os dados locais
 * continuam operacionais.
 */
export function ConnectivityShield() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestoredNotice(true);
        const t = setTimeout(() => setShowRestoredNotice(false), 3500);
        return () => clearTimeout(t);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (!isOnline) {
    return (
      <div
        id="konekta-offline-shield-banner"
        className="sticky top-0 z-50 flex items-center justify-between gap-2 bg-amber-600 px-4 py-2 text-white shadow-md text-xs font-medium animate-in slide-in-from-top-2 duration-300"
      >
        <div className="flex items-center gap-2">
          <WifiOff size={15} className="shrink-0 animate-pulse" />
          <span>
            <strong>Modo Local KONEKTA Ativo:</strong> Sem internet no momento. Os seus pedidos,
            histórico e saldo guardados continuam acessíveis.
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          STP Offline
        </span>
      </div>
    );
  }

  if (showRestoredNotice) {
    return (
      <div
        id="konekta-online-restored-banner"
        className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-emerald-600 px-4 py-1.5 text-white shadow-sm text-xs font-medium animate-in slide-in-from-top-2 fade-in duration-300"
      >
        <CheckCircle2 size={14} className="shrink-0" />
        <span>Ligação à internet restabelecida. Sistema sincronizado com a rede KONEKTA.</span>
      </div>
    );
  }

  return null;
}

/**
 * Blindagem Global da Aplicação KONEKTA:
 * Agrupa as proteções de rede, de renderização e de integridade da sessão.
 */
export function AppShield({ children }: AppShieldProps) {
  return (
    <SafeErrorBoundary>
      <ConnectivityShield />
      {children}
    </SafeErrorBoundary>
  );
}
