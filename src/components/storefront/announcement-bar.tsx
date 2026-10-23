import type { SettingValue } from "@/lib/validations/settings";

const isBengali = (text: string) => /[ঀ-৿]/.test(text);

/** Top ticker. Pure markup so the admin customizer can render a live preview of it. */
export function AnnouncementBar({ settings }: { settings: SettingValue<"appearance.announcement"> }) {
  const messages = settings.messages.filter((m) => m.active).map((m) => m.text);
  if (!settings.enabled || messages.length === 0) return null;

  const style = { backgroundColor: settings.backgroundColor, color: settings.textColor };
  const textClass = (text: string) => (isBengali(text) ? "font-bengali tracking-normal normal-case" : undefined);

  if (settings.mode === "static") {
    return (
      <div className="flex flex-wrap justify-center gap-x-6 px-4 py-2 text-[11px] tracking-[0.2em] uppercase" style={style}>
        {messages.map((text, i) => (
          <span key={i} className="flex items-center gap-6">
            {i > 0 && <span className="opacity-70">✦</span>}
            <span className={textClass(text)}>{text}</span>
          </span>
        ))}
      </div>
    );
  }

  // Duplicated list so the marquee loops seamlessly at -50%.
  const items = [...messages, ...messages];
  return (
    <div className="overflow-hidden py-2 text-[11px] tracking-[0.2em] uppercase" style={style}>
      <div className="flex w-max" style={{ animation: `ribat-marquee ${settings.speed}s linear infinite` }}>
        {items.map((text, i) => (
          <span key={i} className="flex items-center gap-10 px-5" aria-hidden={i >= messages.length}>
            <span className={textClass(text)}>{text}</span>
            <span className="opacity-70">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
