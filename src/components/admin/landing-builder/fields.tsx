"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Small, uncontrolled-free form primitives used by the builder's block editors. */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  bengali,
  type = "text",
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  bengali?: boolean;
  type?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={cn(bengali && "font-bengali")}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  error,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className="font-bengali"
      />
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {label}
    </label>
  );
}

/** "2026-10-20T18:00:00.000Z" ↔ value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function DateTimeInput({
  label,
  value,
  onChange,
  optional,
  error,
}: {
  label: string;
  value: string | undefined;
  onChange: (iso: string | undefined) => void;
  optional?: boolean;
  error?: string;
}) {
  return (
    <Field label={label} error={error} hint="Your local time. The timer hides itself after this moment.">
      <div className="flex gap-2">
        <Input type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />
        {optional && value && (
          <Button type="button" variant="outline" onClick={() => onChange(undefined)}>
            Remove
          </Button>
        )}
      </div>
    </Field>
  );
}

/** Generic repeatable list (benefits, FAQs, reviews…) with add / remove / reorder. */
export function ListEditor<T>({
  items,
  onChange,
  create,
  render,
  addLabel,
  max = 30,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  addLabel: string;
  max?: number;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
            <div className="flex gap-0.5">
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label="Remove"
                className="text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
          </div>
        </div>
      ))}
      {items.length < max && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...items, create()])}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  );
}
