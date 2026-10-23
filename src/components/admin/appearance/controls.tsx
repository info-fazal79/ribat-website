"use client";

import { Field } from "@/components/admin/landing-builder/fields";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Small form controls shared by the Appearance editors. */

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left">
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors",
              value === o.value && "bg-background text-foreground shadow-sm",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <div className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
          aria-label={`${label} picker`}
        />
        <Input value={value} aria-invalid={!!error} onChange={(e) => onChange(e.target.value.trim())} className="font-mono uppercase" />
      </div>
    </Field>
  );
}
