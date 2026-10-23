import { z } from "zod";

const image = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^(https?:\/\/|\/)\S+$/.test(v), "Use the Media Library or a full https:// URL");

/** Admin category create/edit form. `position` is the storefront display order (lower first). */
export const categoryFormSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  nameBn: z.string().trim().max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().trim().max(500),
  imageUrl: image,
  bannerUrl: image,
  position: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
