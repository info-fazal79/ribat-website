import { Heart } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { CategorySlug } from "@/lib/mock/catalog";
import { instagramHandle, type InstagramPost } from "@/lib/mock/content";

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

const art: CategorySlug[] = ["panjabi", "abaya", "fragrance", "panjabi", "thobe", "casual"];

export function InstagramFeed({ posts }: { posts: InstagramPost[] }) {
  const href = `https://instagram.com/${instagramHandle.slice(1)}`;
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow={instagramHandle}
          title="Worn by our community"
          titleBn="ইনস্টাগ্রামে আমাদের সাথে থাকুন"
          align="center"
        />
      </div>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-6">
        {posts.map((post, i) => (
          <a
            key={post.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${post.tone.from}, ${post.tone.to})` }}
          >
            <GeometricPattern color={post.tone.ink} opacity={0.2} />
            <Silhouette
              category={art[i % art.length]}
              fill={`color-mix(in oklch, ${post.tone.ink} 35%, ${post.tone.from})`}
              stroke={post.tone.ink}
              className="absolute inset-x-0 bottom-[6%] mx-auto h-[78%] w-auto transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <InstagramIcon className="size-6" />
              <p className="text-xs">{post.caption}</p>
              <p className="flex items-center gap-1 text-xs opacity-80">
                <Heart className="size-3" fill="currentColor" /> {post.likes.toLocaleString("en-IN")}
              </p>
            </div>
          </a>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
        >
          <InstagramIcon className="size-4" /> Follow {instagramHandle}
        </a>
      </div>
    </section>
  );
}
