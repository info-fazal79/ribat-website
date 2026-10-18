"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
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
  Boxes,
  PanelsTopLeft,
  TicketPercent,
  Users,
  Settings,
} as const;

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <Link href="/admin" className="flex h-16 items-center border-b px-6 font-heading text-xl tracking-[0.2em] uppercase">
        {siteConfig.name}
        <span className="ml-2 font-sans text-[10px] tracking-normal text-muted-foreground normal-case">Admin</span>
      </Link>
      {/* usePathname() is request data on dynamic routes, so it must stream inside Suspense. */}
      <Suspense fallback={<NavLinks pathname={null} />}>
        <ActiveNavLinks />
      </Suspense>
    </aside>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {adminNav.map((item) => {
        const Icon = icons[item.icon];
        const active =
          pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
              active && "bg-sidebar-accent font-medium",
            )}
          >
            <Icon className="size-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
