import { siteConfig } from "@/config/site";
import type { SettingValue } from "@/lib/validations/settings";

/** Image logo when configured, otherwise the RIBAT serif wordmark. */
export function SiteLogo({ branding }: { branding: SettingValue<"appearance.branding"> }) {
  if (branding.logoType === "image" && branding.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL on any host
      <img
        src={branding.logoUrl}
        alt={siteConfig.name}
        style={{ maxWidth: branding.logoWidth, maxHeight: branding.logoHeight }}
        className="mx-auto h-auto w-auto object-contain"
      />
    );
  }
  return (
    <>
      <span className="block font-heading text-3xl font-semibold tracking-[0.35em] uppercase md:text-4xl">
        {siteConfig.name}
      </span>
      <span className="mt-1 hidden text-[9px] tracking-[0.4em] text-muted-foreground uppercase md:block">Est. Dhaka</span>
    </>
  );
}
