import { Heart } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { ArtKind } from "@/lib/catalog/types";
import type { HomeSectionOf } from "@/lib/validations/homepage";

// lucide v1 dropped brand icons; inline glyph.
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

// Illustrated placeholder tiles for slots without a photo.
const art: ArtKind[] = ["panjabi", "abaya", "fragrance", "panjabi", "thobe", "casual"];
const tones = [
  { from: "#efe7d6", to: "#d9ccb0", ink: "#6d5a37" },
  { from: "#2a2522", to: "#141110", ink: "#cbb38a" },
  { from: "#4a2f24", to: "#24160f", ink: "#e2c48e" },
  { from: "#d9c39a", to: "#b89e6c", ink: "#3c2f19" },
  { from: "#1f4d3f", to: "#0f2a22", ink: "#d8c08a" },
  { from: "#a9bccb", to: "#7f95a6", ink: "#1f2a33" },
];

/** "Worn by our community" grid — photos (or illustrated tiles) linking to posts or the profile. */
export function InstagramFeed({ section }: { section: HomeSectionOf<"community"> }) {
  if (section.items.length === 0) return null;
  const profile = section.profileUrl || undefined;
  const cols = section.items.length % 4 === 0 && section.items.length % 6 !== 0 ? "md:grid-cols-4" : "md:grid-cols-6";

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading eyebrow={section.handle} title={section.title} titleBn={section.titleBn || undefined} align="center" />
      </div>
      <div className={`grid grid-cols-3 gap-1 ${cols}`}>
        {section.items.map((post, i) => {
          const tone = tones[i % tones.length];
          const href = post.link || profile;
          const Tile = href ? "a" : "div";
          return (
            <Tile
              key={post.id}
              {...(href && { href, target: "_blank", rel: "noopener noreferrer" })}
              className="group relative aspect-square overflow-hidden"
              style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})` }}
            >
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- media library asset
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <>
                  <GeometricPattern color={tone.ink} opacity={0.2} />
                  <Silhouette
                    kind={art[i % art.length]}
                    fill={`color-mix(in oklch, ${tone.ink} 35%, ${tone.from})`}
                    stroke={tone.ink}
                    className="absolute inset-x-0 bottom-[6%] mx-auto h-[78%] w-auto transition-transform duration-700 group-hover:scale-110"
                  />
                </>
              )}
              {(post.caption || post.likes > 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <InstagramIcon className="size-6" />
                  {post.caption && <p className="text-xs">{post.caption}</p>}
                  {post.likes > 0 && (
                    <p className="flex items-center gap-1 text-xs opacity-80">
                      <Heart className="size-3" fill="currentColor" /> {post.likes.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              )}
            </Tile>
          );
        })}
      </div>
      {profile && section.handle && (
        <div className="mt-10 text-center">
          <a
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
          >
            <InstagramIcon className="size-4" /> Follow {section.handle}
          </a>
        </div>
      )}
    </section>
  );
}
