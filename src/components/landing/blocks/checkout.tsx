"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Banknote, Check, Loader2, Lock, MapPin, Phone, ShieldCheck, Truck, User } from "lucide-react";
import { toast } from "sonner";
import { placeOrder } from "@/app/lp/[slug]/actions";
import { useLandingState } from "@/components/landing/landing-state";
import { normalizeBdPhone } from "@/lib/phone";
import type { LandingPageView } from "@/lib/landing/types";
import { discountPercent, formatBDTBn, toBnDigits } from "@/lib/money";
import type { LandingSection } from "@/lib/validations/landing-page";
import { cn } from "@/lib/utils";

type CheckoutProps = Extract<LandingSection, { type: "checkout" }>["props"];
type Errors = Partial<Record<"offerId" | "variantId" | "shippingZoneId" | "customerName" | "customerPhone" | "addressLine", string>>;

const zoneLabels: Record<string, string> = { "Inside Dhaka": "ঢাকার ভিতরে", "Outside Dhaka": "ঢাকার বাইরে" };

function readUtm() {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"]) {
    const v = params.get(key);
    if (v) utm[key] = v.slice(0, 200);
  }
  return Object.keys(utm).length ? utm : undefined;
}

export function CheckoutBlock({ props, page }: { props: CheckoutProps; page: LandingPageView }) {
  const { offerId, setOfferId, preview } = useLandingState();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ customerName: "", customerPhone: "", addressLine: "", customerNote: "", website: "" });
  const [zoneId, setZoneId] = useState<string | null>(page.zones.length === 1 ? page.zones[0].id : null);
  const formRef = useRef<HTMLFormElement>(null);

  // Variant picking (colour → size), restricted to in-stock options.
  const colors = useMemo(
    () =>
      page.variants.reduce<{ name: string; hex: string | null }[]>(
        (acc, v) => (v.color && !acc.some((c) => c.name === v.color) ? [...acc, { name: v.color, hex: v.colorHex }] : acc),
        [],
      ),
    [page.variants],
  );
  const [color, setColor] = useState<string | null>(
    () => page.variants.find((v) => v.stock > 0 && v.color)?.color ?? colors[0]?.name ?? null,
  );
  const sizes = [...new Set(page.variants.filter((v) => !color || v.color === color).map((v) => v.size).filter(Boolean))] as string[];
  const [size, setSize] = useState<string | null>(null);

  const offer = page.offers.find((o) => o.id === offerId) ?? page.offers[0] ?? null;
  const variant =
    page.variants.length === 1
      ? page.variants[0]
      : page.variants.find((v) => (colors.length === 0 || v.color === color) && (sizes.length === 0 || v.size === size)) ?? null;
  const zone = page.zones.find((z) => z.id === zoneId) ?? null;
  const shipping = !zone ? null : offer?.freeShipping ? 0 : zone.fee;
  const total = (offer?.price ?? 0) + (shipping ?? 0);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!offer) e.offerId = "একটি অফার বেছে নিন";
    if (!variant) e.variantId = sizes.length ? "সাইজ বেছে নিন" : "কালার বেছে নিন";
    else if (offer && variant.stock < offer.quantity) e.variantId = "এই অপশনে পর্যাপ্ত স্টক নেই";
    if (!zone) e.shippingZoneId = "ডেলিভারি এরিয়া বেছে নিন";
    if (form.customerName.trim().length < 2) e.customerName = "আপনার নাম লিখুন";
    if (!normalizeBdPhone(form.customerPhone)) e.customerPhone = "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)";
    if (form.addressLine.trim().length < 8) e.addressLine = "সম্পূর্ণ ঠিকানা লিখুন (বাসা, রোড, থানা, জেলা)";
    return e;
  }

  function submit() {
    if (preview) {
      toast.info("Preview mode — orders are disabled in the builder.");
      return;
    }
    if (form.website) return; // honeypot: bots fill hidden fields
    const e = validate();
    setErrors(e);
    const firstError = Object.keys(e)[0];
    if (firstError) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstError}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    startTransition(async () => {
      // On success the action redirects to the thank-you page.
      const result = await placeOrder({
        landingPageId: page.id,
        offerId: offer!.id,
        variantId: variant!.id,
        shippingZoneId: zone!.id,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        addressLine: form.addressLine,
        customerNote: form.customerNote || undefined,
        utm: readUtm(),
      });
      if (result && !result.ok) {
        toast.error(result.message);
        if (result.field) setErrors((prev) => ({ ...prev, [result.field!]: result.message }));
      }
    });
  }

  return (
    <section id="checkout" className="scroll-mt-4 bg-[linear-gradient(180deg,#f4efe6,#ebe3d4)] px-4 py-14 @3xl:py-20">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h2 className="font-bengali text-2xl font-bold @3xl:text-3xl">{props.title}</h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" /> পণ্য হাতে পেয়ে টাকা পরিশোধ করুন
          </p>
        </div>

        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative space-y-6 rounded-3xl bg-card p-5 shadow-xl ring-1 ring-black/5 @3xl:p-7"
        >
          {/* Offers */}
          <fieldset data-field="offerId" className="space-y-3">
            <legend className="mb-3 font-bengali font-semibold">১. প্যাকেজ বেছে নিন</legend>
            {page.offers.map((o) => {
              const selected = o.id === offer?.id;
              const pct = discountPercent(o.price, o.compareAtPrice);
              return (
                <label
                  key={o.id}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition",
                    selected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="offer"
                    value={o.id}
                    checked={selected}
                    onChange={() => setOfferId(o.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bengali font-semibold">{o.label}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {o.freeShipping && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <Truck className="size-3" /> ফ্রি ডেলিভারি
                        </span>
                      )}
                      {pct > 0 && <span>{toBnDigits(pct)}% সাশ্রয়</span>}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-sans text-lg font-bold">{formatBDTBn(o.price)}</span>
                    {o.compareAtPrice && (
                      <span className="block text-xs text-muted-foreground line-through">{formatBDTBn(o.compareAtPrice)}</span>
                    )}
                  </span>
                  {o.badge && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-[#b8862f] to-[#d8c08a] px-3 py-0.5 text-[11px] font-bold text-[#13231e] shadow">
                      {o.badge}
                    </span>
                  )}
                </label>
              );
            })}
            {errors.offerId && <FieldError>{errors.offerId}</FieldError>}
          </fieldset>

          {/* Variant */}
          {page.variants.length > 1 && (
            <fieldset data-field="variantId" className="space-y-3">
              <legend className="mb-3 font-bengali font-semibold">২. কালার ও সাইজ</legend>
              {colors.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const inStock = page.variants.some((v) => v.color === c.name && v.stock > 0);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        disabled={!inStock}
                        aria-pressed={color === c.name}
                        onClick={() => {
                          setColor(c.name);
                          setSize(null);
                          setErrors((e) => ({ ...e, variantId: undefined }));
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-1.5 text-sm transition disabled:opacity-40",
                          color === c.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className="size-6 rounded-full border border-black/10" style={{ backgroundColor: c.hex ?? "#ccc" }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const v = page.variants.find((x) => (!color || x.color === color) && x.size === s);
                    const available = (v?.stock ?? 0) >= (offer?.quantity ?? 1);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!available}
                        aria-pressed={size === s}
                        onClick={() => {
                          setSize(s);
                          setErrors((e) => ({ ...e, variantId: undefined }));
                        }}
                        className={cn(
                          "h-11 min-w-14 rounded-xl border-2 px-3 font-sans text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
                          size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.variantId && <FieldError>{errors.variantId}</FieldError>}
            </fieldset>
          )}

          {/* Customer */}
          <fieldset className="space-y-3">
            <legend className="mb-3 font-bengali font-semibold">{page.variants.length > 1 ? "৩" : "২"}. আপনার তথ্য</legend>
            <Field icon={User} field="customerName" error={errors.customerName}>
              <input
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="আপনার নাম"
                autoComplete="name"
                aria-label="আপনার নাম"
                aria-invalid={!!errors.customerName}
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <Field icon={Phone} field="customerPhone" error={errors.customerPhone}>
              <input
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={14}
                aria-label="মোবাইল নম্বর"
                aria-invalid={!!errors.customerPhone}
                className="w-full bg-transparent font-sans outline-none"
              />
            </Field>
            <Field icon={MapPin} field="addressLine" error={errors.addressLine} multiline>
              <textarea
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
                placeholder="সম্পূর্ণ ঠিকানা (বাসা, রোড, থানা, জেলা)"
                rows={2}
                autoComplete="street-address"
                aria-label="সম্পূর্ণ ঠিকানা"
                aria-invalid={!!errors.addressLine}
                className="w-full resize-none bg-transparent outline-none"
              />
            </Field>
            {/* Honeypot — hidden from people, irresistible to bots. */}
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
              name="website"
            />

            <div data-field="shippingZoneId" className="grid grid-cols-2 gap-2 pt-1">
              {page.zones.map((z) => (
                <label
                  key={z.id}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-xl border-2 p-3 transition",
                    zoneId === z.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="zone"
                    className="sr-only"
                    checked={zoneId === z.id}
                    onChange={() => {
                      setZoneId(z.id);
                      setErrors((e) => ({ ...e, shippingZoneId: undefined }));
                    }}
                  />
                  <span className="font-bengali text-sm font-semibold">{zoneLabels[z.name] ?? z.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {offer?.freeShipping ? "ফ্রি" : formatBDTBn(z.fee)}
                    {z.estimatedDays && ` · ${toBnDigits(z.estimatedDays)}`}
                  </span>
                </label>
              ))}
            </div>
            {errors.shippingZoneId && <FieldError>{errors.shippingZoneId}</FieldError>}
          </fieldset>

          {/* Summary */}
          <div className="space-y-2 rounded-2xl bg-secondary/70 p-4 text-sm">
            <Row label={`${page.product.nameBn ?? page.product.name}${offer ? ` × ${toBnDigits(offer.quantity)}` : ""}`} value={formatBDTBn(offer?.price ?? 0)} />
            <Row label="ডেলিভারি চার্জ" value={shipping === null ? "এরিয়া বেছে নিন" : shipping === 0 ? "ফ্রি" : formatBDTBn(shipping)} />
            <div className="flex items-center justify-between border-t border-foreground/10 pt-2 text-base font-bold">
              <span>সর্বমোট</span>
              <span className="font-sans text-xl">{formatBDTBn(total)}</span>
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Banknote className="size-3.5 text-emerald-700" /> ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70"
          >
            {pending ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
            {pending ? "অর্ডার হচ্ছে…" : `${props.buttonLabel} — ${formatBDTBn(total)}`}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  icon: Icon,
  field,
  error,
  multiline,
  children,
}: {
  icon: typeof User;
  field: string;
  error?: string;
  multiline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div data-field={field}>
      <div
        className={cn(
          "flex gap-3 rounded-xl border-2 bg-background px-4 transition focus-within:border-primary",
          multiline ? "items-start py-3" : "h-13 items-center",
          error ? "border-destructive" : "border-border",
        )}
      >
        <Icon className={cn("size-4 shrink-0 text-muted-foreground", multiline && "mt-1")} />
        {children}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-sm text-destructive">{children}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
