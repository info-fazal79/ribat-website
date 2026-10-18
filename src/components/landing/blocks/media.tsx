/* eslint-disable @next/next/no-img-element -- landing images are arbitrary admin-supplied URLs */

/** YouTube/Vimeo URL → embeddable URL; null for direct video files. */
function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`;
  } catch {
    return null;
  }
  return null;
}

export function Video({ url, title }: { url: string; title: string }) {
  const embed = embedUrl(url);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl">
      {embed ? (
        <iframe
          src={embed}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <video src={url} controls playsInline preload="metadata" className="size-full object-cover" />
      )}
    </div>
  );
}

export function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />;
}
