"use client";

import { ChevronDown } from "lucide-react";
import { Field, ListEditor, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import type { MenuItem } from "@/lib/validations/settings";

type Link = { title: string; url: string };

const newItem = (): MenuItem => ({
  title: "",
  url: "/",
  links: [],
  megaMenu: false,
  columns: [],
  promo: { enabled: false, imageUrl: "", badge: "", title: "", buttonText: "Shop now", buttonUrl: "" },
});

/** Header menu builder: top-level items, plain dropdown links or a mega menu with columns + promo card. */
export function MenuEditor({
  items,
  onChange,
  errors,
}: {
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  errors: Record<string, string>;
}) {
  const err = (i: number, path: string) => errors[`headerMenu.items.${i}.${path}`];
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      create={newItem}
      addLabel="Add menu item"
      max={12}
      render={(item, update, i) => {
        const submenuCount = item.megaMenu ? item.columns.reduce((n, c) => n + c.links.length, 0) : item.links.length;
        return (
          <div className="min-w-0 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Title" value={item.title} placeholder="Panjabi" error={err(i, "title")} onChange={(title) => update({ title })} />
              <TextInput label="Link" value={item.url} placeholder="/categories/panjabi" error={err(i, "url")} onChange={(url) => update({ url })} />
            </div>
            <Toggle label="Mega menu (full-width dropdown with columns)" checked={item.megaMenu} onChange={(megaMenu) => update({ megaMenu })} />

            {/* Auto-open when a submenu field has a validation error. */}
            <details
              className="group rounded-md border bg-background"
              open={Object.keys(errors).some((k) => /^(links|columns|promo)\./.test(k.slice(`headerMenu.items.${i}.`.length)) && k.startsWith(`headerMenu.items.${i}.`))}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium">
                {item.megaMenu ? "Mega menu columns & promo" : "Dropdown links"}
                <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  {submenuCount ? `${submenuCount} link${submenuCount === 1 ? "" : "s"}` : "None"}
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="space-y-4 border-t p-3">
                {item.megaMenu ? (
                  <>
                    <Field label="Columns" hint="e.g. a “Fabric” column with Silk, Cotton, Kabli. Up to 5 columns.">
                      <ListEditor
                        items={item.columns}
                        onChange={(columns) => update({ columns })}
                        create={() => ({ title: "", links: [] })}
                        addLabel="Add column"
                        max={5}
                        render={(col, updateCol, c) => (
                          <div className="space-y-3">
                            <TextInput label="Column heading" value={col.title} placeholder="Fabric" onChange={(title) => updateCol({ title })} />
                            <LinkList
                              links={col.links}
                              onChange={(links) => updateCol({ links })}
                              errorAt={(l, f) => err(i, `columns.${c}.links.${l}.${f}`)}
                              max={12}
                            />
                          </div>
                        )}
                      />
                    </Field>

                    <div className="space-y-3 border-t pt-4">
                      <Toggle
                        label="Show a promotional card"
                        checked={item.promo.enabled}
                        onChange={(enabled) => update({ promo: { ...item.promo, enabled } })}
                      />
                      {item.promo.enabled && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TextInput
                            label="Promo image URL"
                            value={item.promo.imageUrl}
                            placeholder="https://…/eid-collection.jpg"
                            error={err(i, "promo.imageUrl")}
                            onChange={(imageUrl) => update({ promo: { ...item.promo, imageUrl } })}
                          />
                          <TextInput
                            label="Badge text"
                            value={item.promo.badge}
                            placeholder="New Season"
                            onChange={(badge) => update({ promo: { ...item.promo, badge } })}
                          />
                          <TextInput
                            label="Headline"
                            value={item.promo.title}
                            placeholder="The Eid Edit"
                            bengali
                            onChange={(title) => update({ promo: { ...item.promo, title } })}
                          />
                          <TextInput
                            label="Button text"
                            value={item.promo.buttonText}
                            placeholder="Shop now"
                            onChange={(buttonText) => update({ promo: { ...item.promo, buttonText } })}
                          />
                          <TextInput
                            label="Button link"
                            value={item.promo.buttonUrl}
                            placeholder="/categories/panjabi"
                            error={err(i, "promo.buttonUrl")}
                            onChange={(buttonUrl) => update({ promo: { ...item.promo, buttonUrl } })}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Field label="Dropdown links" hint="Optional. Leave empty for a simple link.">
                    <LinkList links={item.links} onChange={(links) => update({ links })} errorAt={(l, f) => err(i, `links.${l}.${f}`)} max={20} />
                  </Field>
                )}
              </div>
            </details>
          </div>
        );
      }}
    />
  );
}

function LinkList({
  links,
  onChange,
  errorAt,
  max,
}: {
  links: Link[];
  onChange: (links: Link[]) => void;
  errorAt: (index: number, field: "title" | "url") => string | undefined;
  max: number;
}) {
  return (
    <ListEditor
      items={links}
      onChange={onChange}
      create={() => ({ title: "", url: "/" })}
      addLabel="Add link"
      max={max}
      render={(link, update, l) => (
        <div className="grid gap-2 sm:grid-cols-2">
          <TextInput label="Label" value={link.title} placeholder="Silk" error={errorAt(l, "title")} onChange={(title) => update({ title })} />
          <TextInput label="Link" value={link.url} placeholder="/products?fabric=silk" error={errorAt(l, "url")} onChange={(url) => update({ url })} />
        </div>
      )}
    />
  );
}
