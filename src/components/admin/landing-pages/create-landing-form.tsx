"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Loader2, ShoppingCart, Video } from "lucide-react";
import { toast } from "sonner";
import { createLandingPage } from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { landingTemplates, type LandingTemplate } from "@/lib/landing/templates";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

const templateIcons: Record<LandingTemplate, typeof FileText> = {
  "bengali-longform": FileText,
  minimal: ShoppingCart,
  "video-first": Video,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export function CreateLandingForm({ products }: { products: { id: string; name: string; price: number }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [productId, setProductId] = useState("");
  const [template, setTemplate] = useState<LandingTemplate>("bengali-longform");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createLandingPage({ title, slug, productId, template });
      if (!result.ok) return setError(result.message);
      toast.success("Draft created — customise it below");
      router.push(`/admin/landing-pages/${result.id}/edit`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="max-w-2xl space-y-5 rounded-xl border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="lp-title">Page name</Label>
        <Input
          id="lp-title"
          value={title}
          placeholder="e.g. Royal Oud — Eid Offer"
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp-slug">URL</Label>
        <div className="flex items-center rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
          <span className="pl-2.5 text-sm text-muted-foreground">/lp/</span>
          <input
            id="lp-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className="h-8 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Product</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger className="w-full" aria-label="Product">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} · {formatBDT(p.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Starting template</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(landingTemplates) as LandingTemplate[]).map((key) => {
            const t = landingTemplates[key];
            const Icon = templateIcons[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={template === key}
                onClick={() => setTemplate(key)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                  template === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
                )}
              >
                <Icon className={cn("size-4", template === key ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.body}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">1 / 2 / 3-piece bundle offers are generated from the product price.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Create & open builder
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
