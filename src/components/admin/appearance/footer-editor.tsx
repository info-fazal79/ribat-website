"use client";

import { useState } from "react";
import { Switch } from "@/components/admin/appearance/controls";
import { Field, ListEditor, TextArea, TextInput } from "@/components/admin/landing-builder/fields";
import { socialPlatforms, type FooterSettings } from "@/lib/validations/homepage";

/** Appearance → Footer: about copy, link columns, newsletter, social links and bottom bar. */
export function FooterEditor({
  value,
  errors,
  onChange,
}: {
  value: FooterSettings;
  errors: Record<string, string>;
  onChange: (value: FooterSettings) => void;
}) {
  const set = (patch: Partial<FooterSettings>) => onChange({ ...value, ...patch });
  const err = (path: string) => errors[`footer.${path}`];

  return (
    <div className="min-w-0 space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">About</h3>
        <TextArea label="About text" rows={2} value={value.about} onChange={(about) => set({ about })} />
        <TextInput label="Bengali line" bengali value={value.aboutBn} onChange={(aboutBn) => set({ aboutBn })} />
      </section>

      <section className="space-y-3 border-t pt-5">
        <div>
          <h3 className="text-sm font-semibold">Link columns</h3>
          <p className="text-xs text-muted-foreground">Up to four columns between the about text and the newsletter.</p>
        </div>
        <ListEditor
          items={value.columns}
          max={4}
          addLabel="Add column"
          create={() => ({ id: Math.random().toString(36).slice(2, 10), title: "", links: [] })}
          onChange={(columns) => set({ columns })}
          render={(column, update, i) => (
            <>
              <TextInput label="Column title" value={column.title} error={err(`columns.${i}.title`)} onChange={(title) => update({ title })} />
              <Field label="Links">
                <ListEditor
                  items={column.links}
                  max={10}
                  addLabel="Add link"
                  create={() => ({ title: "", url: "/" })}
                  onChange={(links) => update({ links })}
                  render={(link, updateLink, j) => (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <TextInput label="Title" value={link.title} error={err(`columns.${i}.links.${j}.title`)} onChange={(title) => updateLink({ title })} />
                      <TextInput label="URL" value={link.url} placeholder="/products" error={err(`columns.${i}.links.${j}.url`)} onChange={(url) => updateLink({ url })} />
                    </div>
                  )}
                />
              </Field>
            </>
          )}
        />
      </section>

      <section className="space-y-3 border-t pt-5">
        <Switch
          checked={value.newsletter.enabled}
          onChange={(enabled) => set({ newsletter: { ...value.newsletter, enabled } })}
          label="Newsletter box"
          description="Email sign-up box in the last column."
        />
        {value.newsletter.enabled && (
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Title" value={value.newsletter.title} onChange={(title) => set({ newsletter: { ...value.newsletter, title } })} />
            <TextInput label="Text" value={value.newsletter.body} onChange={(body) => set({ newsletter: { ...value.newsletter, body } })} />
            <TextInput
              label="Button label"
              value={value.newsletter.buttonLabel}
              onChange={(buttonLabel) => set({ newsletter: { ...value.newsletter, buttonLabel } })}
            />
          </div>
        )}
      </section>

      <section className="space-y-3 border-t pt-5">
        <h3 className="text-sm font-semibold">Social links</h3>
        <ListEditor
          items={value.social}
          max={6}
          addLabel="Add social link"
          create={() => ({ platform: "facebook" as const, label: "", url: "https://" })}
          onChange={(social) => set({ social })}
          render={(s, update, i) => (
            <div className="grid gap-2 sm:grid-cols-[140px_1fr_1fr]">
              <Field label="Platform">
                <select
                  value={s.platform}
                  onChange={(e) => update({ platform: e.target.value as typeof s.platform })}
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm capitalize"
                >
                  {socialPlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <TextInput label="Label" value={s.label} placeholder="@ribat.bd" onChange={(label) => update({ label })} />
              <TextInput label="URL" value={s.url} error={err(`social.${i}.url`)} onChange={(url) => update({ url })} />
            </div>
          )}
        />
      </section>

      <section className="grid gap-3 border-t pt-5 md:grid-cols-2">
        <TextInput
          label="Copyright notice"
          value={value.copyright}
          placeholder="© Ribat. All rights reserved."
          hint="Leave empty for the default."
          onChange={(copyright) => set({ copyright })}
        />
        <PaymentsInput value={value.payments} error={err("payments")} onChange={(payments) => set({ payments })} />
      </section>
    </div>
  );
}

/** Comma-separated list; keeps the raw text so typing a comma doesn't get normalised away. */
function PaymentsInput({ value, error, onChange }: { value: string[]; error?: string; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join(", "));
  const parse = (v: string) =>
    v
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  // Re-sync when the list changes from outside (e.g. Discard).
  if (parse(text).join("|") !== value.join("|")) setText(value.join(", "));
  return (
    <TextInput
      label="Payment badges"
      value={text}
      hint="Comma-separated, e.g. COD, bKash, Nagad, VISA"
      error={error}
      onChange={(v) => {
        setText(v);
        onChange(parse(v));
      }}
    />
  );
}
