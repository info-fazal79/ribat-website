"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 font-semibold transition hover:bg-muted"
    >
      <Printer className="size-4" /> ইনভয়েস প্রিন্ট করুন
    </button>
  );
}
