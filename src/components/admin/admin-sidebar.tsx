"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import {
  Boxes,
  FolderTree,
  Images,
  LayoutDashboard,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Settings,
  Shirt,
  ShoppingBag,
  TicketPercent,
  Users,
} from "lucide-react";
import { adminNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const icons = {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  FolderTree,
  Images,
  Boxes,
  PanelsTopLeft,
  TicketPercent,
  Users,
  Palette,
  Settings,
} as const;

/** Full-canvas editors start with the sidebar collapsed to icons. */
const BUILDER_ROUTES = [/^\/admin\/appearance\/builder/, /^\/admin\/landing-pages\/[^/]+\/edit/];

export function AdminSidebar() {
  return (
    // usePathname() is request data on dynamic routes, so it must stream inside Suspense.
    <Suspense fallback={<SidebarShell pathname={null} />}>
      <ActiveSidebar />
    </Suspense>
  );
}

function ActiveSidebar() {
  return <SidebarShell pathname={usePathname()} />;
}

function SidebarShell({ pathname }: { pathname: string | null }) {
  // null = automatic (collapsed on builder routes); once toggled, the choice sticks for the session.
  const [pinned, setPinned] = useState<boolean | null>(null);
  const auto = pathname !== null && BUILDER_ROUTES.some((r) => r.test(pathname));
  const collapsed = pinned ?? auto;

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex md:flex-col",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <Link
        href="/admin"
        className={cn("flex h-16 items-center border-b font-heading text-xl tracking-[0.2em] uppercase", collapsed ? "justify-center px-0" : "px-6")}
        title={collapsed ? `${siteConfig.name} Admin` : undefined}
      >
        {collapsed ? siteConfig.name.charAt(0) : siteConfig.name}
        {!collapsed && <span className="ml-2 font-sans text-[10px] tracking-normal text-muted-foreground normal-case">Admin</span>}
      </Link>
      <nav className={cn("flex flex-1 flex-col gap-0.5 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
        {adminNav.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              aria-label={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm transition-colors hover:bg-sidebar-accent",
                collapsed ? "justify-center px-0" : "px-3",
                active && "bg-sidebar-accent font-medium",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => setPinned(!collapsed)}
        className={cn(
          "flex items-center gap-3 border-t py-3 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
          collapsed ? "justify-center" : "px-6",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
