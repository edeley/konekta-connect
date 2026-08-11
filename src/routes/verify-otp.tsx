import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OTPInput } from "@/components/auth/OTPInput";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { authFlow, useAuthFlow } from "@/lib/auth-flow";
import { DEMO_OTP, OTP_LENGTH, OTP_RESEND_SECONDS, maskEmail, maskPhone } from "@/lib/auth-schemas";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verificar código — KONEKTA" },
      {
        name: "description",
        content: "Introduza o código de 4 dígitos enviado para o seu telemóvel +239 e conclua a entrada na KONEKTA.",
      },
      { property: "og:title", content: "Verificar código — KONEKTA" },
      { property: "og:description", content: "Verificação em dois passos por SMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const phone = useAuthFlow((s) => s.phone);
  const email = useAuthFlow((s) => s.email);
  const blockUntil = useAuthFlow((s) => s.blockUntil);
  const user = useStore((s) => s.user);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [blockLeft, setBlockLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
      setBlockLeft(blockUntil ? Math.max(0, Math.ceil((blockUntil - Date.now()) / 1000)) : 0);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [blockUntil]);

  const blocked = blockLeft > 0;
  const target = email ? maskEmail(email) : phone ? maskPhone(phone) : "o seu contacto";

  const verify = () => {
    if (blocked || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code === DEMO_OTP) {
        authFlow.resetOtp();
        toast.success("Número verificado!");
        navigate({ to: user ? "/" : "/registro", replace: true });
        return;
      }
      const nowBlocked = authFlow.failOtp();
      setShake(true);
      setCode("");
      window.setTimeout(() => setShake(false), 450);
      setError(
        nowBlocked
          ? "Muitas tentativas. Tente novamente em 15 minutos."
          : "Código incorreto. Tente novamente.",
      );
      toast.error(nowBlocked ? "Conta temporariamente bloqueada" : "Código incorreto");
    }, 700);
  };

  const resend = () => {
    setSeconds(OTP_RESEND_SECONDS);
    setError(undefined);
    toast.success(`Novo código enviado para ${target}`, {
      description: `Código de demonstração: ${DEMO_OTP}`,
    });
  };

  return (
    <AuthLayout back>
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/12 text-success">
          <ShieldCheck size={32} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Verifique o seu número</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enviámos um código para {target}</p>
      </div>

      <div className="mt-8 space-y-6">
        <OTPInput
          onComplete={setCode}
          onChangeCode={(c) => {
            setCode(c);
            if (error) setError(undefined);
          }}
          error={error}
          shake={shake}
          disabled={blocked}
        />

        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          {blocked ? (
            <span className="font-semibold text-destructive">
              Bloqueado. Tente novamente em {Math.floor(blockLeft / 60)}:
              {String(blockLeft % 60).padStart(2, "0")}
            </span>
          ) : seconds > 0 ? (
            <>Reenviar código em 0:{String(seconds).padStart(2, "0")}</>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-primary hover:underline">
              Reenviar código
            </button>
          )}
        </p>

        <LoadingButton
          loading={loading}
          disabled={code.length !== OTP_LENGTH || blocked}
          onClick={verify}
        >
          Verificar
        </LoadingButton>
      </div>
    </AuthLayout>
  );
}
