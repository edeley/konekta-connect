import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { DistrictSelect } from "@/components/auth/DistrictSelect";
import { FileUpload } from "@/components/auth/FileUpload";
import { authFlow, useAuthFlow } from "@/lib/auth-flow";
import {
  FILE_RULES,
  GENDERS,
  clientProfileSchema,
  sanitizeInput,
} from "@/lib/auth-schemas";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register/client")({
  head: () => ({
    meta: [
      { title: "Criar conta de cliente — KONEKTA" },
      {
        name: "description",
        content:
          "Complete o seu perfil de cliente KONEKTA em menos de um minuto e contrate profissionais verificados em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Criar conta de cliente — KONEKTA" },
      { property: "og:description", content: "Registo rápido, com poucos campos obrigatórios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterClientPage,
});

function RegisterClientPage() {
  const navigate = useNavigate();
  const phone = useAuthFlow((s) => s.phone);
  const draft = useAuthFlow((s) => s.registration);

  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [email, setEmail] = useState(draft.email ?? "");
  const [district, setDistrict] = useState(draft.district ?? "");
  const [zone, setZone] = useState(draft.zone ?? "");
  const [gender, setGender] = useState(draft.gender ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const payload = { fullName, email, district, zone, gender };
  const valid = clientProfileSchema.safeParse(payload).success;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = clientProfileSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Verifique os campos obrigatórios");
      return;
    }
    setErrors({});
    setLoading(true);
    authFlow.updateRegistration(payload);
    setTimeout(() => {
      store.registerClient({
        phone: phone ?? "+239900000000",
        name: sanitizeInput(fullName),
        email: email || undefined,
        district,
        address: sanitizeInput(zone),
        gender,
      });
      store.markOnboarded();
      authFlow.clear();
      setLoading(false);
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/", replace: true });
    }, 900);
  };

  return (
    <AuthLayout back step={2} totalSteps={2}>
      <h1 className="text-2xl font-extrabold tracking-tight">Complete o seu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Precisamos de alguns dados para criar a sua conta.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <FileUpload
          label="Foto de perfil"
          hint="Adicionar foto"
          circle
          accept={FILE_RULES.profilePhoto.accept}
          maxSize={FILE_RULES.profilePhoto.maxSize}
          onChange={() => undefined}
        />

        <Field label="Nome completo" required error={errors.fullName}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
            className="k-input"
          />
        </Field>

        <Field label="Email (opcional)" error={errors.email}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            type="email"
            autoComplete="email"
            className="k-input"
          />
        </Field>

        <DistrictSelect value={district} onChange={setDistrict} required error={errors.district} />

        <Field label="Zona / Morada" required error={errors.zone}>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Ex: Trindade, perto do mercado"
            className="k-input"
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">
            Sexo <span className="text-destructive">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <label
                key={g.value}
                className={cn(
                  "press flex min-h-11 cursor-pointer items-center justify-center rounded-xl border bg-card text-sm font-medium",
                  gender === g.value ? "border-primary bg-accent text-primary" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  className="sr-only"
                  checked={gender === g.value}
                  onChange={() => setGender(g.value)}
                />
                {g.label}
              </label>
            ))}
          </div>
          {errors.gender && (
            <p role="alert" className="text-xs text-destructive">
              {errors.gender}
            </p>
          )}
        </fieldset>

        <LoadingButton type="submit" loading={loading} disabled={!valid}>
          Concluir Cadastro
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
        <div className="mt-1.5">{children}</div>
      </label>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
