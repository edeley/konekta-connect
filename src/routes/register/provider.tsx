import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { DistrictSelect } from "@/components/auth/DistrictSelect";
import { FileUpload } from "@/components/auth/FileUpload";
import { Field } from "@/components/auth/Field";
import { authFlow, useAuthFlow } from "@/lib/auth-flow";
import {
  FILE_RULES,
  GENDERS,
  SERVICE_CATEGORIES,
  providerProfileSchema,
  sanitizeInput,
} from "@/lib/auth-schemas";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register/provider")({
  head: () => ({
    meta: [
      { title: "Registo de prestador — KONEKTA" },
      {
        name: "description",
        content:
          "Ofereça os seus serviços na KONEKTA: preencha o perfil, escolha categorias e distritos de atuação e envie o BI para verificação.",
      },
      { property: "og:title", content: "Registo de prestador — KONEKTA" },
      { property: "og:description", content: "Trabalhe com clientes verificados em São Tomé e Príncipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterProviderPage,
});

function RegisterProviderPage() {
  const navigate = useNavigate();
  const phone = useAuthFlow((s) => s.phone);
  const role = useAuthFlow((s) => s.role);
  const draft = useAuthFlow((s) => s.registration);

  const [section, setSection] = useState<"pessoais" | "profissionais">("pessoais");
  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [email, setEmail] = useState(draft.email ?? "");
  const [district, setDistrict] = useState(draft.district ?? "");
  const [zone, setZone] = useState(draft.zone ?? "");
  const [gender, setGender] = useState(draft.gender ?? "");
  const [bio, setBio] = useState(draft.bio ?? "");
  const [categories, setCategories] = useState<string[]>(draft.categories ?? []);
  const [workDistricts, setWorkDistricts] = useState<string[]>(draft.workDistricts ?? []);
  const [idFront, setIdFront] = useState(false);
  const [idBack, setIdBack] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const payload = {
    fullName,
    email,
    district,
    zone,
    gender,
    bio,
    categories,
    workDistricts,
    idFront,
    idBack,
  };
  const valid = providerProfileSchema.safeParse(payload).success;

  const toggleCategory = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = providerProfileSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      const personal = ["fullName", "email", "district", "zone", "gender"];
      setSection(Object.keys(next).some((k) => personal.includes(k)) ? "pessoais" : "profissionais");
      toast.error("Verifique os campos obrigatórios");
      return;
    }
    setErrors({});
    setLoading(true);
    authFlow.updateRegistration({ fullName, email, district, zone, gender, bio, categories, workDistricts });
    setTimeout(() => {
      store.registerProvider(
        {
          phone: phone ?? "+239900000000",
          name: sanitizeInput(fullName),
          email: email || undefined,
          district,
          gender,
        },
        {
          category: categories[0],
          yearsExperience: 1,
          bio: sanitizeInput(bio),
          services: [],
          district,
          city: sanitizeInput(zone),
          radiusKm: 15,
          documents: { selfieOk: true },
        },
      );
      store.markOnboarded();
      setLoading(false);
      toast.success("Cadastro enviado para análise");
      navigate({ to: "/pending-approval", replace: true });
    }, 1000);
  };

  return (
    <AuthLayout back step={2} totalSteps={2}>
      <h1 className="text-2xl font-extrabold tracking-tight">
        {role === "both" ? "Conta de cliente e prestador" : "Complete o seu perfil profissional"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Os documentos são verificados pela equipa KONEKTA em até 24h.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {(["pessoais", "profissionais"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            aria-pressed={section === s}
            className={cn(
              "min-h-10 rounded-full text-xs font-semibold transition-colors",
              section === s ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
            )}
          >
            {s === "pessoais" ? "Dados pessoais" : "Dados profissionais"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {section === "pessoais" ? (
          <>
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
                type="email"
                placeholder="seu@email.com"
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
            <LoadingButton variant="outline" onClick={() => setSection("profissionais")}>
              Continuar para dados profissionais
            </LoadingButton>
          </>
        ) : (
          <>
            <Field
              label="Descrição do serviço"
              required
              error={errors.bio}
              hint={`${bio.length}/500 caracteres`}
            >
              <textarea
                value={bio}
                maxLength={500}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Descreva os seus serviços, experiência e disponibilidade..."
                className="k-input min-h-28 resize-y py-2"
              />
            </Field>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                Categorias <span className="text-destructive">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((c) => {
                  const on = categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleCategory(c)}
                      className={cn(
                        "press min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {errors.categories && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.categories}
                </p>
              )}
            </fieldset>

            <DistrictSelect
              multiple
              label="Onde atua?"
              required
              value={workDistricts}
              onChange={setWorkDistricts}
              error={errors.workDistricts}
            />

            <FileUpload
              label="BI Frente"
              hint="Foto da frente do BI (JPG ou PNG, máx 5MB)"
              required
              secure
              accept={FILE_RULES.bi.accept}
              maxSize={FILE_RULES.bi.maxSize}
              onChange={(f) => setIdFront(f.length > 0)}
            />
            {errors.idFront && (
              <p role="alert" className="text-xs text-destructive">
                {errors.idFront}
              </p>
            )}

            <FileUpload
              label="BI Verso"
              hint="Foto do verso do BI (JPG ou PNG, máx 5MB)"
              required
              secure
              accept={FILE_RULES.bi.accept}
              maxSize={FILE_RULES.bi.maxSize}
              onChange={(f) => setIdBack(f.length > 0)}
            />
            {errors.idBack && (
              <p role="alert" className="text-xs text-destructive">
                {errors.idBack}
              </p>
            )}

            <FileUpload
              label="Portfólio (opcional)"
              hint="Fotos dos seus trabalhos — máximo 5 imagens"
              multiple
              maxFiles={FILE_RULES.portfolio.maxFiles}
              accept={FILE_RULES.portfolio.accept}
              maxSize={FILE_RULES.portfolio.maxSize}
              onChange={() => undefined}
            />

            <LoadingButton type="submit" loading={loading} disabled={!valid}>
              Concluir Cadastro
            </LoadingButton>
          </>
        )}
      </form>
    </AuthLayout>
  );
}
