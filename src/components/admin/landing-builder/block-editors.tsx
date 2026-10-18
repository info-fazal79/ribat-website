"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          <p className="text-xs text-muted-foreground">Offers, delivery areas and variants are set in the Offers and Settings tabs.</p>
        </div>
      );
  }
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
      <TextInput
        label="Image URL (optional)"
        value={props.imageUrl}
        error={errors.imageUrl}
        hint="Defaults to the product's first image."
        placeholder="https://…"
        onChange={(v) => set({ imageUrl: blank(v) })}
      />
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
  return (
    <div className="space-y-3">
      <TextInput label="Section title" bengali value={props.title} onChange={(v) => onChange({ ...props, title: blank(v) })} />
      <Field label="Images" hint="Leave empty to use the product's images (or placeholder art).">
        <ListEditor
          items={props.images}
          max={20}
          addLabel="Add image URL"
          create={() => ({ url: "", alt: "" })}
          onChange={(images) => onChange({ ...props, images })}
          render={(img, update, i) => (
            <>
              <TextInput label="Image URL" value={img.url} error={errors[`images.${i}.url`]} placeholder="https://…" onChange={(url) => update({ url })} />
              <TextInput label="Alt text" value={img.alt} onChange={(v) => update({ alt: blank(v) })} />
            </>
          )}
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
          addLabel="Add screenshot URL"
          create={() => ({ url: "" })}
          onChange={(items) => onChange({ ...props, screenshotUrls: items.map((x) => x.url) })}
          render={(s, update, i) => (
            <TextInput label="Image URL" value={s.url} error={errors[`screenshotUrls.${i}`]} placeholder="https://…" onChange={(url) => update({ url })} />
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
