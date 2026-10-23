"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Layers, Loader2, Package, Plus, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "@/app/(admin)/admin/products/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ProductArt } from "@/components/storefront/art";
import { ProductImages } from "@/components/admin/products/product-images";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { categoryArt } from "@/config/category-art";
import type { ProductEditData } from "@/lib/admin/types";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

type Color = { name: string; hex: string };
type VariantEdit = { sku?: string; price?: string; compareAtPrice?: string; stock?: string; isActive?: boolean };

type FormState = {
  id?: string;
  name: string;
  slug: string;
  type: "SIMPLE" | "VARIABLE";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  category: string;
  shortDescription: string;
  description: string;
  fabricCare: string;
  tags: string[];
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  lowStockAt: string;
  colors: Color[];
  sizes: string[];
  variantEdits: Record<string, VariantEdit>;
  images: string[];
};

const SIZE_PRESETS = [
  { label: "Letter", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { label: "Length (abaya / thobe)", sizes: ["50", "52", "54", "56", "58", "60"] },
  { label: "Other", sizes: ["Free Size"] },
];

const COLOR_PRESETS: Color[] = [
  { name: "Ivory", hex: "#efe7d6" },
  { name: "Black", hex: "#151515" },
  { name: "Emerald", hex: "#1f4d3f" },
  { name: "Navy", hex: "#1f2a44" },
  { name: "Maroon", hex: "#5a1f24" },
  { name: "Sand", hex: "#cdb48c" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const code = (s: string) => s.replace(/\s+/g, "").slice(0, 3).toUpperCase();

function initialState(product?: ProductEditData): FormState {
  if (!product) {
    return {
      name: "",
      slug: "",
      type: "VARIABLE",
      status: "DRAFT",
      category: "",
      shortDescription: "",
      description: "",
      fabricCare: "",
      tags: [],
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      sku: "",
      price: "",
      compareAtPrice: "",
      costPrice: "",
      stock: "0",
      lowStockAt: "3",
      colors: [],
      sizes: [],
      variantEdits: {},
      images: [],
    };
  }
  // Existing variant values, keyed the same way the variant grid keys its rows ("Ivory|L").
  const variantEdits: Record<string, VariantEdit> = {};
  if (product.type === "VARIABLE") {
    for (const v of product.variants) {
      variantEdits[[v.color, v.size].filter(Boolean).join("|")] = {
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice === null ? "" : String(v.compareAtPrice),
        stock: String(v.stock),
        isActive: v.isActive,
      };
    }
  }
  const str = (n: number | null) => (n === null ? "" : String(n));
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: product.type,
    status: product.status,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    fabricCare: product.fabricCare,
    tags: product.tags,
    isFeatured: product.isFeatured,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    sku: product.sku,
    price: str(product.price),
    compareAtPrice: str(product.compareAtPrice),
    costPrice: str(product.costPrice),
    stock: str(product.stock),
    lowStockAt: str(product.lowStockAt),
    colors: product.type === "VARIABLE" ? product.colors : [],
    sizes: product.type === "VARIABLE" ? product.sizes : [],
    variantEdits,
    images: product.images,
  };
}

const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));
const optNum = (s: string) => (s.trim() === "" ? null : Number(s));

type CategoryOption = { slug: string; name: string; nameBn: string | null };

export function ProductForm({ product, categories }: { product?: ProductEditData; categories: CategoryOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const variants = useMemo(() => {
    if (form.type !== "VARIABLE") return [];
    const colors: (Color | null)[] = form.colors.length ? form.colors : [null];
    const sizes: (string | null)[] = form.sizes.length ? form.sizes : [null];
    if (!form.colors.length && !form.sizes.length) return [];
    return colors.flatMap((c) =>
      sizes.map((s) => {
        const parts = [c?.name, s].filter(Boolean) as string[];
        const optionKey = parts.join("|");
        const edit = form.variantEdits[optionKey] ?? {};
        return {
          optionKey,
          title: parts.join(" / "),
          color: c,
          size: s,
          sku: edit.sku ?? [form.sku || "SKU", ...parts.map(code)].join("-"),
          price: edit.price ?? form.price,
          compareAtPrice: edit.compareAtPrice ?? form.compareAtPrice,
          stock: edit.stock ?? "0",
          isActive: edit.isActive ?? true,
        };
      }),
    );
  }, [form]);

  const editVariant = (key: string, patch: VariantEdit) =>
    setForm((f) => ({ ...f, variantEdits: { ...f.variantEdits, [key]: { ...f.variantEdits[key], ...patch } } }));

  const totalStock =
    form.type === "SIMPLE" ? Number(form.stock) || 0 : variants.reduce((n, v) => n + (v.isActive ? Number(v.stock) || 0 : 0), 0);

  function submit() {
    const common = {
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      category: form.category,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      fabricCare: form.fabricCare || undefined,
      tags: form.tags,
      isFeatured: form.isFeatured,
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      images: form.images,
    };
    const payload =
      form.type === "SIMPLE"
        ? {
            ...common,
            type: "SIMPLE" as const,
            simple: {
              sku: form.sku,
              price: num(form.price),
              compareAtPrice: optNum(form.compareAtPrice),
              costPrice: optNum(form.costPrice),
              stock: num(form.stock),
              lowStockAt: num(form.lowStockAt),
            },
          }
        : {
            ...common,
            type: "VARIABLE" as const,
            colors: form.colors,
            sizes: form.sizes,
            variants: variants.map((v) => ({
              optionKey: v.optionKey,
              title: v.title,
              color: v.color?.name ?? null,
              size: v.size,
              sku: v.sku,
              price: num(v.price),
              compareAtPrice: optNum(v.compareAtPrice),
              stock: num(v.stock),
              isActive: v.isActive,
            })),
          };

    startTransition(async () => {
      const result = await saveProduct(payload);
      if (result.ok) {
        setErrors({});
        toast.success(product ? "Changes saved" : "Product created", {
          description: form.status === "ACTIVE" ? "Live on the storefront." : undefined,
        });
        if (product) router.refresh();
        else router.push(`/admin/products/${result.id}/edit`);
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.message);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="pb-16"
    >
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products" aria-label="Back to products">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-medium">{product ? form.name || product.name : "Add product"}</h1>
            <p className="text-xs text-muted-foreground">{product ? `Editing · ${product.sku}` : "New product"}</p>
          </div>
          <ProductStatusBadge status={form.status} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Discard</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {product ? "Save changes" : "Save product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Product name" error={errors.name} htmlFor="name">
                <Input
                  id="name"
                  value={form.name}
                  placeholder="e.g. Noor Embroidered Cotton Panjabi"
                  aria-invalid={!!errors.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                  }}
                />
              </Field>
              <Field label="URL slug" error={errors.slug} htmlFor="slug" hint={`/products/${form.slug || "your-product"}`}>
                <Input
                  id="slug"
                  value={form.slug}
                  aria-invalid={!!errors.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </Field>
              <Field label="Short description" htmlFor="short" hint="Shown on product cards and in search results.">
                <Textarea
                  id="short"
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                />
              </Field>
              <Field label="Description (বাংলা / English)" htmlFor="desc">
                <Textarea
                  id="desc"
                  rows={5}
                  className="font-bengali"
                  placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <Field label="Fabric & care" htmlFor="care">
                <Textarea id="care" rows={2} value={form.fabricCare} onChange={(e) => set("fabricCare", e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <ProductImages
            images={form.images}
            onChange={(images) => set("images", images)}
            error={Object.entries(errors).find(([k]) => k.startsWith("images"))?.[1]}
          />

          {/* Product type */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Product type</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "SIMPLE", icon: Package, title: "Simple product", body: "One SKU, one price — e.g. attar, caps, books." },
                  { value: "VARIABLE", icon: Layers, title: "Variable product", body: "Colour / size variants, each with its own SKU, price & stock." },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={form.type === opt.value}
                  onClick={() => set("type", opt.value)}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-left transition",
                    form.type === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
                  )}
                >
                  <opt.icon className={cn("mt-0.5 size-5 shrink-0", form.type === opt.value ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="text-sm font-medium">{opt.title}</p>
                    <p className="text-xs text-muted-foreground">{opt.body}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {form.type === "SIMPLE" ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-base">Pricing & inventory</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <MoneyField label="Price" value={form.price} onChange={(v) => set("price", v)} error={errors["simple.price"]} />
                <MoneyField
                  label="Compare-at price"
                  value={form.compareAtPrice}
                  onChange={(v) => set("compareAtPrice", v)}
                  error={errors["simple.compareAtPrice"]}
                  hint="Shown struck-through"
                />
                <MoneyField label="Cost price" value={form.costPrice} onChange={(v) => set("costPrice", v)} hint={margin(form.price, form.costPrice)} />
                <Field label="SKU" error={errors["simple.sku"]} htmlFor="sku">
                  <Input id="sku" value={form.sku} className="font-mono" onChange={(e) => set("sku", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Stock" error={errors["simple.stock"]} htmlFor="stock">
                  <Input id="stock" type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
                </Field>
                <Field label="Low stock alert at" error={errors["simple.lowStockAt"]} htmlFor="low">
                  <Input id="low" type="number" min={0} value={form.lowStockAt} onChange={(e) => set("lowStockAt", e.target.value)} />
                </Field>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-base">Variants</CardTitle>
                <CardDescription>Pick colours and sizes — every combination becomes a variant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Base SKU" htmlFor="basesku" hint="Variant SKUs are generated from this">
                    <Input id="basesku" value={form.sku} className="font-mono" placeholder="RBT-PJ-003" onChange={(e) => set("sku", e.target.value.toUpperCase())} />
                  </Field>
                  <MoneyField label="Default price" value={form.price} onChange={(v) => set("price", v)} />
                  <MoneyField label="Default compare-at" value={form.compareAtPrice} onChange={(v) => set("compareAtPrice", v)} />
                </div>

                <ColorPicker colors={form.colors} onChange={(c) => set("colors", c)} />
                <SizePicker sizes={form.sizes} onChange={(s) => set("sizes", s)} />

                {errors.variants && <p className="text-sm text-destructive">{errors.variants}</p>}

                {variants.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {variants.length} variants · {totalStock} units
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setForm((f) => {
                            const edits = { ...f.variantEdits };
                            for (const v of variants) edits[v.optionKey] = { ...edits[v.optionKey], price: f.price, compareAtPrice: f.compareAtPrice };
                            return { ...f, variantEdits: edits };
                          });
                          toast.success("Default prices applied to all variants");
                        }}
                      >
                        <Wand2 /> Apply default price to all
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 pl-3">On</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Price (৳)</TableHead>
                            <TableHead>Compare (৳)</TableHead>
                            <TableHead>Stock</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((v, i) => (
                            <TableRow key={v.optionKey} className={cn(!v.isActive && "opacity-50")}>
                              <TableCell className="pl-3">
                                <Checkbox
                                  checked={v.isActive}
                                  onCheckedChange={(c) => editVariant(v.optionKey, { isActive: c === true })}
                                  aria-label={`Enable ${v.title}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  {v.color && <span className="size-4 rounded-full border" style={{ backgroundColor: v.color.hex }} />}
                                  {v.title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={v.sku}
                                  className="h-8 w-44 font-mono text-xs"
                                  aria-invalid={!!errors[`variants.${i}.sku`]}
                                  onChange={(e) => editVariant(v.optionKey, { sku: e.target.value.toUpperCase() })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={v.price}
                                  className="h-8 w-24"
                                  aria-invalid={!!errors[`variants.${i}.price`]}
                                  onChange={(e) => editVariant(v.optionKey, { price: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={v.compareAtPrice}
                                  className="h-8 w-24"
                                  aria-invalid={!!errors[`variants.${i}.compareAtPrice`]}
                                  title={errors[`variants.${i}.compareAtPrice`]}
                                  onChange={(e) => editVariant(v.optionKey, { compareAtPrice: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={v.stock}
                                  className="h-8 w-20"
                                  aria-invalid={!!errors[`variants.${i}.stock`]}
                                  onChange={(e) => editVariant(v.optionKey, { stock: e.target.value })}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {Object.keys(errors).some((k) => k.startsWith("variants.")) && (
                      <p className="text-sm text-destructive">Some variant rows have invalid values — check the highlighted cells.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Search engine listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="truncate text-xs text-emerald-700">ribat.com.bd › products › {form.slug || "…"}</p>
                <p className="truncate text-base text-sky-800">{form.metaTitle || form.name || "Product title"}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {form.metaDescription || form.shortDescription || "Meta description will appear here."}
                </p>
              </div>
              <Field label="Meta title" htmlFor="mt" hint={`${form.metaTitle.length}/70`} error={errors.metaTitle}>
                <Input id="mt" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
              </Field>
              <Field label="Meta description" htmlFor="md" hint={`${form.metaDescription.length}/160`} error={errors.metaDescription}>
                <Textarea id="md" rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active — visible on store</SelectItem>
                  <SelectItem value="DRAFT">Draft — hidden</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={form.isFeatured} onCheckedChange={(c) => set("isFeatured", c === true)} className="mt-0.5" />
                <span>
                  Featured product
                  <span className="block text-xs text-muted-foreground">Shown in “Trending Now” on the homepage.</span>
                </span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Category" error={errors.category}>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="w-full" aria-label="Category" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                        {c.nameBn && <span className="font-bengali text-muted-foreground">· {c.nameBn}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <TagInput tags={form.tags} onChange={(t) => set("tags", t)} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="font-sans text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- media library asset
                <img src={form.images[0]} alt="" className="aspect-[3/4] w-full rounded-md object-cover" />
              ) : (
                <ProductArt
                  kind={categoryArt(form.category).kind}
                  color={form.colors[0]?.hex ?? categoryArt(form.category).productColor}
                  className="aspect-[3/4] rounded-md"
                />
              )}
              <div>
                <p className="text-sm font-medium">{form.name || "Product name"}</p>
                <p className="text-sm">
                  {form.price ? formatBDT(form.price) : "৳—"}
                  {form.compareAtPrice && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">{formatBDT(form.compareAtPrice)}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{totalStock} units in stock</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function margin(price: string, cost: string) {
  const p = Number(price);
  const c = Number(cost);
  if (!p || !c) return "Used for profit reports";
  return `Margin ${Math.round(((p - c) / p) * 100)}% · Profit ${formatBDT(p - c)}`;
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}) {
  const id = `money-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
        <Input
          id={id}
          type="number"
          min={0}
          step="1"
          value={value}
          aria-invalid={!!error}
          className="pl-6"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

function ColorPicker({ colors, onChange }: { colors: Color[]; onChange: (c: Color[]) => void }) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#1f4d3f");
  const add = (c: Color) => {
    if (!c.name.trim() || colors.some((x) => x.name.toLowerCase() === c.name.trim().toLowerCase())) return;
    onChange([...colors, { name: c.name.trim(), hex: c.hex }]);
  };

  return (
    <div className="space-y-2">
      <Label>Colours</Label>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-2 rounded-full border bg-background py-1 pr-1 pl-1.5 text-sm">
            <span className="size-4 rounded-full border" style={{ backgroundColor: c.hex }} />
            {c.name}
            <button
              type="button"
              onClick={() => onChange(colors.filter((x) => x.name !== c.name))}
              className="grid size-5 place-items-center rounded-full hover:bg-muted"
              aria-label={`Remove ${c.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {colors.length === 0 && <span className="text-xs text-muted-foreground">No colours yet.</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
          aria-label="Colour swatch"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Colour name"
          className="w-40"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add({ name, hex });
              setName("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            add({ name, hex });
            setName("");
          }}
        >
          <Plus /> Add
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        {COLOR_PRESETS.filter((p) => !colors.some((c) => c.name === p.name)).map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => add(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-solid hover:text-foreground"
          >
            <span className="size-3 rounded-full border" style={{ backgroundColor: p.hex }} />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizePicker({ sizes, onChange }: { sizes: string[]; onChange: (s: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const toggle = (s: string) => onChange(sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s]);
  const customSizes = sizes.filter((s) => !SIZE_PRESETS.some((g) => g.sizes.includes(s)));

  return (
    <div className="space-y-3">
      <Label>Sizes</Label>
      {SIZE_PRESETS.map((group) => (
        <div key={group.label} className="flex flex-wrap items-center gap-1.5">
          <span className="w-40 text-xs text-muted-foreground">{group.label}</span>
          {group.sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sizes.includes(s)}
              onClick={() => toggle(s)}
              className={cn(
                "h-8 min-w-10 rounded-md border px-2.5 text-xs font-medium transition",
                sizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-40 text-xs text-muted-foreground">Custom</span>
        {customSizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-primary bg-primary px-2.5 text-xs font-medium text-primary-foreground"
          >
            {s} <X className="size-3" />
          </button>
        ))}
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. 42"
          className="h-8 w-24"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (custom.trim() && !sizes.includes(custom.trim())) onChange([...sizes, custom.trim()]);
              setCustom("");
            }
          }}
        />
      </div>
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const t = value.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue("");
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor="tags">Tags</Label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border p-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="tags"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={tags.length ? "" : "eid, cotton, bestseller…"}
          className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add.</p>
    </div>
  );
}
