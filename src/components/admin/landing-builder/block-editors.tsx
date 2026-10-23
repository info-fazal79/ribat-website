"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaModal } from "@/components/admin/media-modal";
import { MediaField } from "@/components/admin/media/media-field";
import { Segmented } from "@/components/admin/appearance/controls";
import { benefitIconMap } from "@/components/landing/icons";
import { DateTimeInput, Field, ListEditor, TextArea, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import type { LandingSection } from "@/lib/validations/landing-page";

type Block<T extends LandingSection["type"]> = Extract<LandingSection, { type: T }>;
type EditorProps<T extends LandingSection["type"]> = {
  props: Block<T>["props"];
  onChange: (props: Block<T>["props"]) => void;
  /** Errors keyed by path inside props, e.g. "imageUrl" or "items.2.title". */
  errors: Record<string, string>;
};

const blank = (v: string) => (v.trim() === "" ? undefined : v);

export function BlockEditor({
  section,
  onChange,
  errors,
}: {
  section: LandingSection;
  onChange: (section: LandingSection) => void;
  errors: Record<string, string>;
}) {
  // Each editor narrows `section` by type; onChange rebuilds the same-typed block.
  switch (section.type) {
    case "hero":
      return <HeroEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "benefits":
      return <BenefitsEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "gallery":
      return <GalleryEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "reviews":
      return <ReviewsEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "faq":
      return <FaqEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "countdown":
      return <CountdownEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "richText":
      return (
        <TextArea
          label="Text"
          rows={6}
          value={section.props.html}
          error={errors.html}
          onChange={(html) => onChange({ ...section, props: { html } })}
        />
      );
    case "checkout":
      return (
        <div className="space-y-3">
          <TextInput
            label="Section title"
            bengali
            value={section.props.title}
            onChange={(title) => onChange({ ...section, props: { ...section.props, title } })}
          />
          <TextInput
            label="Button label"
            bengali
            value={section.props.buttonLabel}
            onChange={(buttonLabel) => onChange({ ...section, props: { ...section.props, buttonLabel } })}
          />
          <p className="text-xs text-muted-foreground">
            Variable products show colour swatches and size pills here automatically, limited to in-stock options. Pick which variants
            and delivery areas are offered in Settings.
          </p>
        </div>
      );
    case "offers":
      return (
        <div className="space-y-3">
          <TextInput label="Section title" bengali value={section.props.title} onChange={(v) => onChange({ ...section, props: { ...section.props, title: blank(v) } })} />
          <TextInput label="Subtitle" bengali value={section.props.subtitle} onChange={(v) => onChange({ ...section, props: { ...section.props, subtitle: blank(v) } })} />
          <TextInput
            label="Card button label"
            bengali
            value={section.props.ctaLabel}
            onChange={(ctaLabel) => onChange({ ...section, props: { ...section.props, ctaLabel } })}
          />
        </div>
      );
    case "comparison":
      return <ComparisonEditor props={section.props} errors={errors} onChange={(props) => onChange({ ...section, props })} />;
    case "stickyBar":
      return (
        <div className="space-y-3">
          <TextInput
            label="Button label"
            bengali
            value={section.props.buttonLabel}
            onChange={(buttonLabel) => onChange({ ...section, props: { ...section.props, buttonLabel } })}
          />
          <Toggle
            label="Show selected package & price"
            checked={section.props.showPrice}
            onChange={(showPrice) => onChange({ ...section, props: { ...section.props, showPrice } })}
          />
          <p className="text-xs text-muted-foreground">
            Pinned to the bottom of phone screens and hidden while the checkout form is visible. Hide this block to turn the bar off.
          </p>
        </div>
      );
  }
}

function ComparisonEditor({ props, onChange, errors }: EditorProps<"comparison">) {
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <div className="grid grid-cols-2 gap-2">
        <TextInput label="Our column" bengali value={props.oursLabel} onChange={(oursLabel) => onChange({ ...props, oursLabel })} />
        <TextInput label="Other column" bengali value={props.othersLabel} onChange={(othersLabel) => onChange({ ...props, othersLabel })} />
      </div>
      <ListEditor
        items={props.rows}
        max={15}
        addLabel="Add row"
        create={() => ({ feature: "", ours: true, others: false })}
        onChange={(rows) => onChange({ ...props, rows })}
        render={(row, update, i) => (
          <>
            <TextInput label="Feature" bengali value={row.feature} error={errors[`rows.${i}.feature`]} onChange={(feature) => update({ feature })} />
            <div className="flex gap-4">
              <Toggle label={`✓ ${props.oursLabel}`} checked={row.ours} onChange={(ours) => update({ ours })} />
              <Toggle label={`✓ ${props.othersLabel}`} checked={row.others} onChange={(others) => update({ others })} />
            </div>
          </>
        )}
      />
    </div>
  );
}

function HeroEditor({ props, onChange, errors }: EditorProps<"hero">) {
  const set = (patch: Partial<typeof props>) => onChange({ ...props, ...patch });
  return (
    <div className="space-y-3">
      <TextInput label="Badge" bengali value={props.badge} onChange={(v) => set({ badge: blank(v) })} placeholder="ঈদ স্পেশাল অফার" />
      <TextArea label="Headline" value={props.headline} error={errors.headline} onChange={(headline) => set({ headline })} />
      <TextArea label="Sub-headline" value={props.subheadline} onChange={(v) => set({ subheadline: blank(v) })} />
      <TextInput label="Button label" bengali value={props.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} />
      <Toggle label="Show price & discount badge" checked={props.showPrice} onChange={(showPrice) => set({ showPrice })} />
      <DateTimeInput
        label="Countdown ends at (optional)"
        optional
        value={props.countdownEndsAt}
        error={errors.countdownEndsAt}
        onChange={(countdownEndsAt) => set({ countdownEndsAt })}
      />
      <Field label="Image (optional)" hint="Leave empty to use the product's featured image." error={errors.imageUrl}>
        <MediaField value={props.imageUrl ?? ""} onChange={(v) => set({ imageUrl: blank(v) })} previewClassName="sm:w-28" />
      </Field>
      <TextInput
        label="Video URL (optional)"
        value={props.videoUrl}
        error={errors.videoUrl}
        hint="YouTube, Vimeo or an .mp4 link — replaces the image."
        placeholder="https://youtube.com/watch?v=…"
        onChange={(v) => set({ videoUrl: blank(v) })}
      />
    </div>
  );
}

function BenefitsEditor({ props, onChange, errors }: EditorProps<"benefits">) {
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <ListEditor
        items={props.items}
        max={12}
        addLabel="Add benefit"
        create={() => ({ icon: "sparkles", title: "", body: "" })}
        onChange={(items) => onChange({ ...props, items })}
        render={(item, update, i) => (
          <>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <Field label="Icon">
                <Select value={item.icon ?? "sparkles"} onValueChange={(icon) => update({ icon })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(benefitIconMap).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <Icon /> {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <TextInput label="Title" bengali value={item.title} error={errors[`items.${i}.title`]} onChange={(title) => update({ title })} />
            </div>
            <TextArea label="Description" value={item.body} onChange={(v) => update({ body: blank(v) })} />
          </>
        )}
      />
    </div>
  );
}

function GalleryEditor({ props, onChange, errors }: EditorProps<"gallery">) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <Segmented
        label="Layout"
        value={props.layout}
        options={[
          { value: "slider", label: "Slider + thumbnails" },
          { value: "grid", label: "Mosaic grid" },
        ]}
        onChange={(layout) => onChange({ ...props, layout })}
      />
      <Field label="Images" hint="Leave empty to show all of the product's gallery images (kept in sync with the product).">
        <ListEditor
          items={props.images}
          max={20}
          addLabel="Add image"
          create={() => ({ url: "", alt: "" })}
          onChange={(images) => onChange({ ...props, images })}
          render={(img, update, i) => (
            <>
              <MediaField value={img.url} error={errors[`images.${i}.url`]} onChange={(url) => update({ url })} previewClassName="h-20 sm:w-20" />
              <TextInput label="Alt text" value={img.alt} onChange={(v) => update({ alt: blank(v) })} />
            </>
          )}
        />
        <Button type="button" variant="outline" size="sm" className="mt-2" disabled={props.images.length >= 20} onClick={() => setPicking(true)}>
          <Images /> Add several from Media Library
        </Button>
        <MediaModal
          open={picking}
          onOpenChange={setPicking}
          multiple
          title="Add gallery images"
          onSelect={(items) =>
            onChange({ ...props, images: [...props.images, ...items.map((m) => ({ url: m.url, alt: m.name }))].slice(0, 20) })
          }
        />
      </Field>
      <TextInput
        label="Video URL (optional)"
        value={props.videoUrl}
        error={errors.videoUrl}
        placeholder="https://youtube.com/watch?v=…"
        onChange={(v) => onChange({ ...props, videoUrl: blank(v) })}
      />
      <Field label="Feature highlights">
        <ListEditor
          items={props.highlights}
          max={8}
          addLabel="Add highlight"
          create={() => ({ title: "", body: "" })}
          onChange={(highlights) => onChange({ ...props, highlights })}
          render={(h, update) => (
            <>
              <TextInput label="Title" bengali value={h.title} onChange={(title) => update({ title })} />
              <TextInput label="Detail" bengali value={h.body} onChange={(v) => update({ body: blank(v) })} />
            </>
          )}
        />
      </Field>
    </div>
  );
}

function ReviewsEditor({ props, onChange, errors }: EditorProps<"reviews">) {
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <Segmented
        label="Layout"
        value={props.layout}
        options={[
          { value: "carousel", label: "Carousel" },
          { value: "grid", label: "Grid" },
        ]}
        onChange={(layout) => onChange({ ...props, layout })}
      />
      <Toggle
        label="Also show approved product reviews"
        checked={props.source === "product"}
        onChange={(on) => onChange({ ...props, source: on ? "product" : "screenshots" })}
      />
      <Field label="Testimonials">
        <ListEditor
          items={props.items}
          addLabel="Add testimonial"
          create={() => ({ name: "", location: "", rating: 5, body: "", verified: true })}
          onChange={(items) => onChange({ ...props, items })}
          render={(r, update, i) => (
            <>
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Name" bengali value={r.name} error={errors[`items.${i}.name`]} onChange={(name) => update({ name })} />
                <TextInput label="Location" bengali value={r.location} onChange={(v) => update({ location: blank(v) })} />
              </div>
              <TextArea label="Review" value={r.body} error={errors[`items.${i}.body`]} onChange={(body) => update({ body })} />
              <div className="flex items-center gap-4">
                <Field label="Rating">
                  <Select value={String(r.rating)} onValueChange={(v) => update({ rating: Number(v) })}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {"★".repeat(n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Toggle label="Verified buyer" checked={r.verified} onChange={(verified) => update({ verified })} />
              </div>
            </>
          )}
        />
      </Field>
      <Field label="Review screenshots">
        <ListEditor
          items={props.screenshotUrls.map((url) => ({ url }))}
          max={20}
          addLabel="Add screenshot"
          create={() => ({ url: "" })}
          onChange={(items) => onChange({ ...props, screenshotUrls: items.map((x) => x.url) })}
          render={(s, update, i) => (
            <MediaField value={s.url} error={errors[`screenshotUrls.${i}`]} onChange={(url) => update({ url })} previewClassName="h-20 sm:w-20" />
          )}
        />
      </Field>
    </div>
  );
}

function FaqEditor({ props, onChange, errors }: EditorProps<"faq">) {
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <ListEditor
        items={props.items}
        addLabel="Add question"
        create={() => ({ question: "", answer: "" })}
        onChange={(items) => onChange({ ...props, items })}
        render={(item, update, i) => (
          <>
            <TextInput label="Question" bengali value={item.question} error={errors[`items.${i}.question`]} onChange={(question) => update({ question })} />
            <TextArea label="Answer" value={item.answer} error={errors[`items.${i}.answer`]} onChange={(answer) => update({ answer })} />
          </>
        )}
      />
    </div>
  );
}

function CountdownEditor({ props, onChange, errors }: EditorProps<"countdown">) {
  return (
    <div className="space-y-3">
      <TextInput label="Label" bengali value={props.label} onChange={(v) => onChange({ ...props, label: blank(v) })} />
      <DateTimeInput
        label="Ends at"
        value={props.endsAt}
        error={errors.endsAt}
        onChange={(endsAt) => endsAt && onChange({ ...props, endsAt })}
      />
    </div>
  );
}
