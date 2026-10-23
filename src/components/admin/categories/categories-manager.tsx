"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, FolderTree, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, saveCategory } from "@/app/(admin)/admin/categories/actions";
import { Switch } from "@/components/admin/appearance/controls";
import { Field, TextArea, TextInput } from "@/components/admin/landing-builder/fields";
import { MediaField } from "@/components/admin/media/media-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { slugify, type CategoryFormValues } from "@/lib/validations/category";
import type { AdminCategory } from "@/server/services/admin";
import { cn } from "@/lib/utils";

const blank = (position: number): CategoryFormValues => ({
  name: "",
  nameBn: "",
  slug: "",
  description: "",
  imageUrl: "",
  bannerUrl: "",
  position,
  isActive: true,
});

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CategoryFormValues | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q) || c.nameBn.includes(query.trim())) : categories;
  const nextPosition = categories.reduce((n, c) => Math.max(n, c.position + 1), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
          <div className="flex h-8 w-full max-w-xs items-center gap-2 rounded-lg border px-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Search categories"
            />
          </div>
          <Button onClick={() => setEditing(blank(nextPosition))}>
            <Plus /> Add Category
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 pl-4">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {categories.length ? "No categories match your search." : "No categories yet — add your first one."}
                </TableCell>
              </TableRow>
            )}
            {visible.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-4">
                  <span className="grid size-11 place-items-center overflow-hidden rounded-md border bg-muted">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- media library asset
                      <img src={c.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <FolderTree className="size-4 text-muted-foreground" />
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...c })}
                    className="text-left font-medium hover:underline"
                  >
                    {c.name}
                  </button>
                  {c.nameBn && <p className="font-bengali text-xs text-muted-foreground">{c.nameBn}</p>}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{c.slug}</TableCell>
                <TableCell className="text-right tabular-nums">{c.productCount}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{c.position}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                      c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.isActive ? "Active" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-0.5">
                    {c.isActive && (
                      <Button variant="ghost" size="icon-sm" asChild aria-label={`View ${c.name} on the store`}>
                        <Link href={`/categories/${c.slug}`} target="_blank">
                          <ExternalLink />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.name}`}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(c)}
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategorySheet value={editing} onClose={() => setEditing(null)} />
      <DeleteDialog category={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function CategorySheet({ value, onClose }: { value: CategoryFormValues | null; onClose: () => void }) {
  return (
    <Sheet open={value !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        {/* Keyed so the form resets for each category opened. */}
        {value && <CategoryForm key={value.id ?? "new"} initial={value} onDone={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function CategoryForm({ initial, onDone }: { initial: CategoryFormValues; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<CategoryFormValues>) => setForm((f) => ({ ...f, ...patch }));

  function submit() {
    startTransition(async () => {
      const result = await saveCategory(form);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }
      toast.success(initial.id ? "Category updated" : "Category created");
      router.refresh();
      onDone();
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <SheetHeader className="border-b">
        <SheetTitle>{initial.id ? "Edit category" : "Add category"}</SheetTitle>
        <SheetDescription>{initial.id ? `/categories/${initial.slug}` : "Shown in menus, filters and the homepage showcase."}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <TextInput
          label="Name"
          value={form.name}
          error={errors.name}
          placeholder="e.g. Jubba"
          onChange={(name) => set({ name, ...(!slugTouched && { slug: slugify(name) }) })}
        />
        <TextInput label="Bengali name" bengali value={form.nameBn} error={errors.nameBn} placeholder="জুব্বা" onChange={(nameBn) => set({ nameBn })} />
        <Field label="Slug" error={errors.slug} hint={slugTouched ? undefined : "Generated from the name — edit to customise."}>
          <div className="flex items-center rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-2.5 text-sm text-muted-foreground">/categories/</span>
            <input
              value={form.slug}
              aria-label="Slug"
              aria-invalid={!!errors.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: e.target.value.toLowerCase() });
              }}
              className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
            />
          </div>
        </Field>
        <TextArea label="Description" rows={3} value={form.description} error={errors.description} onChange={(description) => set({ description })} />
        <Field label="Category image" hint="Square or portrait — used on homepage tiles and in admin." error={errors.imageUrl}>
          <MediaField value={form.imageUrl} onChange={(imageUrl) => set({ imageUrl })} previewClassName="h-28 sm:w-28" />
        </Field>
        <Field label="Page banner (optional)" hint="Wide image behind the category page title." error={errors.bannerUrl}>
          <MediaField value={form.bannerUrl} onChange={(bannerUrl) => set({ bannerUrl })} previewClassName="h-24 sm:w-44" />
        </Field>
        <div className="grid grid-cols-2 items-end gap-4">
          <Field label="Display order" hint="Lower numbers show first." error={errors.position}>
            <Input type="number" min={0} max={999} value={form.position} onChange={(e) => set({ position: Number(e.target.value) || 0 })} />
          </Field>
          <Switch checked={form.isActive} onChange={(isActive) => set({ isActive })} label="Active" description="Visible on the storefront." />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {initial.id ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ category, onClose }: { category: AdminCategory | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={category !== null} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{category?.name}”?</DialogTitle>
          <DialogDescription>
            {category?.productCount
              ? `Its ${category.productCount} product${category.productCount === 1 ? "" : "s"} stay in the catalog but become uncategorised. `
              : ""}
            Menu links to /categories/{category?.slug} will stop working. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              category &&
              startTransition(async () => {
                const result = await deleteCategory(category.id);
                if (!result.ok) toast.error(result.message);
                else {
                  toast.success(`“${category.name}” deleted`);
                  router.refresh();
                }
                onClose();
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
