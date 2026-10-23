"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Type } from "lucide-react";
import { toast } from "sonner";
import { saveAppearance } from "@/app/(admin)/admin/appearance/actions";
import { Field, ListEditor, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { SiteLogo } from "@/components/storefront/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SettingValue } from "@/lib/validations/settings";

type Branding = SettingValue<"appearance.branding">;
type Announcement = SettingValue<"appearance.announcement">;
type Draft = { branding: Branding; announcement: Announcement };

const DEFAULT_COLORS = { backgroundColor: "#123e31", textColor: "#d4af37" };

export function AppearanceCustomizer(initial: Draft) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(draft) !== saved;

  const setBranding = (patch: Partial<Branding>) => setDraft((d) => ({ ...d, branding: { ...d.branding, ...patch } }));
  const setAnnouncement = (patch: Partial<Announcement>) =>
    setDraft((d) => ({ ...d, announcement: { ...d.announcement, ...patch } }));

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function save() {
    startTransition(async () => {
      const result = await saveAppearance(draft);
      if (result.ok) {
        setErrors({});
        setSaved(JSON.stringify(draft));
        toast.success("Saved — live on the storefront");
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.message);
      }
    });
  }

  const { branding, announcement } = draft;

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border bg-background">
        <p className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">Live preview</p>
        <AnnouncementBar settings={announcement} />
        <div className="flex h-20 items-center justify-center border-b px-4 text-center leading-none">
          <SiteLogo branding={branding} />
        </div>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding & Logo</TabsTrigger>
          <TabsTrigger value="announcement">Top Announcement Bar</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6 rounded-xl border bg-card p-6">
          <Field label="Logo type">
            <div className="grid max-w-md grid-cols-2 gap-2">
              {(
                [
                  { value: "text", label: "Text logo", icon: Type },
                  { value: "image", label: "Image logo", icon: ImageIcon },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBranding({ logoType: value })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                    branding.logoType === value && "border-primary bg-primary/5 font-medium",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {branding.logoType === "image" ? (
            <div className="grid gap-6 md:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <TextInput
                  label="Logo image URL"
                  value={branding.logoUrl}
                  placeholder="https://…/ribat-logo.png"
                  hint="PNG or SVG with a transparent background works best."
                  error={errors["branding.logoUrl"]}
                  onChange={(logoUrl) => setBranding({ logoUrl })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="Max width (px)"
                    value={branding.logoWidth}
                    min={40}
                    max={400}
                    error={errors["branding.logoWidth"]}
                    onChange={(logoWidth) => setBranding({ logoWidth })}
                  />
                  <NumberInput
                    label="Max height (px)"
                    value={branding.logoHeight}
                    min={20}
                    max={160}
                    error={errors["branding.logoHeight"]}
                    onChange={(logoHeight) => setBranding({ logoHeight })}
                  />
                </div>
              </div>
              <Field label="Preview">
                <div className="flex h-36 items-center justify-center rounded-lg border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-3">
                  {branding.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL preview
                    <img src={branding.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image yet</span>
                  )}
                </div>
              </Field>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The storefront shows the classic <span className="font-heading tracking-[0.2em]">RIBAT</span> serif wordmark.
            </p>
          )}

          <div className="grid gap-6 border-t pt-6 md:grid-cols-[1fr_220px]">
            <TextInput
              label="Favicon URL"
              value={branding.faviconUrl}
              placeholder="https://…/favicon.png"
              hint="Square PNG or ICO, at least 32×32. Leave empty for the default icon."
              error={errors["branding.faviconUrl"]}
              onChange={(faviconUrl) => setBranding({ faviconUrl })}
            />
            <Field label="Preview">
              <div className="flex h-16 items-center justify-center rounded-lg border bg-muted/30">
                {branding.faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL preview
                  <img src={branding.faviconUrl} alt="Favicon preview" className="size-8 object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Default</span>
                )}
              </div>
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-6 rounded-xl border bg-card p-6">
          <Toggle
            label="Show the announcement bar on the storefront"
            checked={announcement.enabled}
            onChange={(enabled) => setAnnouncement({ enabled })}
          />

          <Field label="Messages" hint="Only active messages are shown. Use the arrows to change the order." error={errors["announcement.messages"]}>
            <ListEditor
              items={announcement.messages}
              onChange={(messages) => setAnnouncement({ messages })}
              create={() => ({ text: "", active: true })}
              addLabel="Add message"
              max={20}
              render={(item, update, i) => (
                <div className="space-y-2">
                  <TextInput
                    label="Text"
                    value={item.text}
                    bengali
                    placeholder="সারা বাংলাদেশে ক্যাশ অন ডেলিভারি"
                    error={errors[`announcement.messages.${i}.text`]}
                    onChange={(text) => update({ text })}
                  />
                  <Toggle label="Active" checked={item.active} onChange={(active) => update({ active })} />
                </div>
              )}
            />
          </Field>

          <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
            <ColorInput
              label="Background colour"
              value={announcement.backgroundColor}
              error={errors["announcement.backgroundColor"]}
              onChange={(backgroundColor) => setAnnouncement({ backgroundColor })}
            />
            <ColorInput
              label="Text colour"
              value={announcement.textColor}
              error={errors["announcement.textColor"]}
              onChange={(textColor) => setAnnouncement({ textColor })}
            />
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAnnouncement(DEFAULT_COLORS)}>
                Reset to emerald & gold
              </Button>
            </div>
          </div>

          <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
            <Field label="Animation">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "marquee", label: "Scrolling ticker" },
                    { value: "static", label: "Static (centered)" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnnouncement({ mode: value })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted",
                      announcement.mode === value && "border-primary bg-primary/5 font-medium",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            {announcement.mode === "marquee" && (
              <Field label={`Ticker speed — ${announcement.speed}s per loop`} hint="Lower is faster.">
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={1}
                  value={announcement.speed}
                  onChange={(e) => setAnnouncement({ speed: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </Field>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-muted/80 py-4 backdrop-blur">
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button type="button" variant="outline" disabled={!dirty || pending} onClick={() => setDraft(JSON.parse(saved))}>
          Discard
        </Button>
        <Button type="button" disabled={!dirty || pending} onClick={save}>
          {pending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Input type="number" min={min} max={max} value={value} aria-invalid={!!error} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  );
}

function ColorInput({
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
