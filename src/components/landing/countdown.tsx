"use client";

import { useEffect, useState } from "react";
import { toBnDigits } from "@/lib/money";
import { cn } from "@/lib/utils";

function remaining(endsAt: number, now: number) {
  const ms = Math.max(0, endsAt - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

/**
 * Urgency timer. Renders nothing until mounted (avoids a server/client time mismatch)
 * and hides itself once the deadline has passed.
 */
export function Countdown({
  endsAt,
  label,
  tone = "dark",
  className,
}: {
  endsAt: string;
  label?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Subscribe to the clock; the first tick runs immediately.
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  if (now === null || Number.isNaN(end)) return <div className={cn("h-[76px]", className)} aria-hidden />;
  const t = remaining(end, now);
  if (t.done) return null;

  const units = [
    { value: t.days, label: "দিন" },
    { value: t.hours, label: "ঘণ্টা" },
    { value: t.minutes, label: "মিনিট" },
    { value: t.seconds, label: "সেকেন্ড" },
  ];

  return (
    <div className={cn("space-y-2", className)} role="timer" aria-live="off">
      {label && (
        <p className={cn("text-sm font-medium", tone === "dark" ? "text-[#f6f1e7]/85" : "text-foreground/80")}>{label}</p>
      )}
      <div className="flex gap-2">
        {units.map((u) => (
          <div
            key={u.label}
            className={cn(
              "flex min-w-14 flex-col items-center rounded-lg px-2 py-1.5",
              tone === "dark" ? "bg-[#f6f1e7]/10 text-[#f6f1e7] ring-1 ring-[#d8c08a]/30" : "bg-primary text-primary-foreground",
            )}
          >
            <span className="font-sans text-2xl leading-none font-semibold tabular-nums">
              {toBnDigits(String(u.value).padStart(2, "0"))}
            </span>
            <span className="mt-1 text-[10px] opacity-80">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
