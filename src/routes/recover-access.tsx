import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { authFlow } from "@/lib/auth-flow";
import { phoneSchema } from "@/lib/auth-schemas";

export const Route = createFileRoute("/recover-access")({
  head: () => ({
    meta: [
      { title: "Recuperar acesso — KONEKTA" },
      {
        name: "description",
        content:
          "Perdeu o acesso à sua conta KONEKTA? Introduza o seu número de telemóvel e receba um código de verificação para criar uma nova palavra-passe.",
      },
      { property: "og:title", content: "Recuperar acesso — KONEKTA" },
      { property: "og:description", content: "Receba um código e recupere a sua conta em minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverAccessPage,
});

function RecoverAccessPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    setLoading(true);
    authFlow.setPhone(phone);
    authFlow.setRecovery("phone", phone);
    setTimeout(() => {
      setLoading(false);
      toast.success("Código enviado. Use 1234 na demonstração.");
      navigate({ to: "/verify-otp" });
    }, 800);
  };

  return (
    <AuthLayout back showLogo>
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-primary">
          <KeyRound size={30} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Recuperar acesso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviaremos um código de verificação para o seu telemóvel.
        </p>
      </div>

      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <PhoneInput value={phone} onChange={setPhone} error={error} autoFocus />
        <LoadingButton type="submit" loading={loading} disabled={phone.replace(/\D/g, "").length < 7}>
          Enviar código
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}
