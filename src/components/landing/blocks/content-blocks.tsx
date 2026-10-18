import { BadgeCheck, CheckCircle2, Quote } from "lucide-react";
import { ProductArt } from "@/components/storefront/art";
import { StarRating } from "@/components/storefront/star-rating";
import { Countdown } from "@/components/landing/countdown";
import { benefitIcon } from "@/components/landing/icons";
import { Img, Video } from "@/components/landing/blocks/media";
import { CheckoutButton } from "@/components/landing/landing-state";
import type { LandingPageView } from "@/lib/landing/types";
import { toBnDigits } from "@/lib/money";
import type { LandingSection } from "@/lib/validations/landing-page";

type Props<T extends LandingSection["type"]> = Extract<LandingSection, { type: T }>["props"];

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="font-bengali text-2xl font-bold @3xl:text-3xl">{children}</h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-10 bg-gold" />
        <span className="text-gold">✦</span>
        <span className="h-px w-10 bg-gold" />
      </div>
    </div>
  );
}

export function BenefitsBlock({ props }: { props: Props<"benefits"> }) {
  if (props.items.length === 0) return null;
  return (
    <section className="bg-background px-5 py-14 @3xl:py-20">
      <div className="mx-auto max-w-5xl">
        {props.title && <SectionTitle>{props.title}</SectionTitle>}
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {props.items.map((item, i) => {
            const Icon = benefitIcon(item.icon);
            return (
              <div
                key={i}
                className="group flex gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e6d3a6] to-[#b89e6c] text-[#13231e] shadow-inner">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-bengali text-base font-semibold">{item.title}</h3>
                  {item.body && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <CheckoutButton className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90">
            এখনই অর্ডার করুন
          </CheckoutButton>
        </div>
      </div>
    </section>
  );
}

export function GalleryBlock({ props, page }: { props: Props<"gallery">; page: LandingPageView }) {
  const images = props.images.length ? props.images : page.product.images.map((i) => ({ url: i.url, alt: i.alt ?? undefined }));
  // No photos yet → placeholder art in each available colour.
  const swatches = [...new Set(page.variants.map((v) => v.colorHex).filter(Boolean) as string[])];
  const placeholders = (swatches.length ? swatches : [page.product.color]).slice(0, 3);

  return (
    <section className="bg-secondary/50 px-5 py-14 @3xl:py-20">
      <div className="mx-auto max-w-5xl space-y-10">
        {props.title && <SectionTitle>{props.title}</SectionTitle>}
        {props.videoUrl && <Video url={props.videoUrl} title={props.title ?? page.product.name} />}

        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {images.length
            ? images.map((img, i) => (
                <div key={img.url} className={i === 0 ? "col-span-2 row-span-2 @3xl:col-span-2" : ""}>
                  <Img
                    src={img.url}
                    alt={img.alt ?? page.product.name}
                    className="aspect-square size-full rounded-2xl object-cover shadow-sm"
                  />
                </div>
              ))
            : placeholders.map((hex, i) => (
                <ProductArt
                  key={hex}
                  kind={page.product.art}
                  color={hex}
                  className={i === 0 ? "col-span-2 aspect-[4/3] rounded-2xl @3xl:col-span-2 @3xl:row-span-2 @3xl:aspect-auto" : "aspect-square rounded-2xl"}
                />
              ))}
        </div>

        {props.highlights.length > 0 && (
          <ul className="grid gap-3 @2xl:grid-cols-2">
            {props.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-background p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-bengali font-semibold">{h.title}</p>
                  {h.body && <p className="text-sm text-muted-foreground">{h.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function ReviewsBlock({ props, page }: { props: Props<"reviews">; page: LandingPageView }) {
  const reviews = [...props.items, ...(props.source === "product" ? page.productReviews : [])];
  if (reviews.length === 0 && props.screenshotUrls.length === 0) return null;
  const avg = page.product.reviewCount ? page.product.rating : reviews.reduce((n, r) => n + r.rating, 0) / (reviews.length || 1);

  return (
    <section className="bg-background px-5 py-14 @3xl:py-20">
      <div className="mx-auto max-w-5xl">
        {props.title && <SectionTitle>{props.title}</SectionTitle>}
        <div className="mb-8 flex flex-col items-center gap-1">
          <p className="font-sans text-4xl font-bold">{toBnDigits(avg.toFixed(1))}</p>
          <StarRating rating={avg} size="md" />
          <p className="text-sm text-muted-foreground">
            {toBnDigits(Math.max(page.product.reviewCount, reviews.length))}+ সন্তুষ্ট গ্রাহক
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] @3xl:mx-0 @3xl:grid @3xl:grid-cols-3 @3xl:overflow-visible @3xl:px-0">
            {reviews.map((r, i) => (
              <figure key={i} className="flex w-[82%] shrink-0 snap-start flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm @3xl:w-auto">
                <div className="flex items-center justify-between">
                  <StarRating rating={r.rating} />
                  <Quote className="size-6 text-gold/40" />
                </div>
                <blockquote className="flex-1 font-bengali text-[15px] leading-relaxed">“{r.body}”</blockquote>
                <figcaption className="flex items-center gap-3 border-t pt-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary font-bengali text-sm text-primary-foreground">
                    {r.name.charAt(0)}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="flex items-center gap-1 font-bengali font-medium">
                      {r.name}
                      {r.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-normal text-emerald-700">
                          <BadgeCheck className="size-3.5" /> ভেরিফায়েড ক্রেতা
                        </span>
                      )}
                    </p>
                    {r.location && <p className="text-xs text-muted-foreground">{r.location}</p>}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {props.screenshotUrls.length > 0 && (
          <div className="mt-6 columns-2 gap-3 @3xl:columns-3">
            {props.screenshotUrls.map((url) => (
              <Img key={url} src={url} alt="Customer review screenshot" className="mb-3 w-full rounded-xl border shadow-sm" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CountdownBlock({ props }: { props: Props<"countdown"> }) {
  return (
    <section className="bg-gradient-to-r from-[#5a1f24] via-[#7a2a30] to-[#5a1f24] px-5 py-8 text-center">
      <Countdown endsAt={props.endsAt} label={props.label ?? "⏰ অফার শেষ হতে বাকি"} className="flex flex-col items-center" />
    </section>
  );
}

export function TextBlock({ props }: { props: Props<"richText"> }) {
  if (!props.html.trim()) return null;
  return (
    <section className="bg-background px-5 py-12">
      {/* Plain text only — admin content is never injected as HTML. */}
      <div className="mx-auto max-w-2xl font-bengali text-[17px] leading-loose whitespace-pre-line">{props.html}</div>
    </section>
  );
}
