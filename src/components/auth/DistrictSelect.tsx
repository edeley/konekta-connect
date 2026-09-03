import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STP_DISTRICTS } from "@/lib/auth-schemas";

type SingleProps = {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
};

type MultiProps = {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  required?: boolean;
};

export function DistrictSelect(props: SingleProps | MultiProps) {
  const id = useId();
  const { label = "Distrito", error, required } = props;

  if (props.multiple) {
    const toggle = (d: string) =>
      props.onChange(
        props.value.includes(d) ? props.value.filter((x) => x !== d) : [...props.value, d],
      );
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </legend>
        <div className="grid gap-1.5">
          {STP_DISTRICTS.map((d) => {
            const checked = props.value.includes(d);
            return (
              <label
                key={d}
                className={cn(
                  "press flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 text-sm",
                  checked ? "border-primary bg-accent" : "border-border",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(d)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 place-items-center rounded-md border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {checked && <Check size={13} />}
                </span>
                {d}
              </label>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <select
        id={id}
        value={props.value ?? ""}
        aria-invalid={!!error}
        onChange={(e) => props.onChange(e.target.value)}
        className={cn(
          "min-h-11 w-full rounded-xl border bg-card px-3 text-base outline-none transition-colors focus:ring-2 focus:ring-ring/40",
          error ? "border-destructive" : "border-border focus:border-primary",
          !props.value && "text-muted-foreground",
        )}
      >
        <option value="">Selecione o seu distrito</option>
        {STP_DISTRICTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
