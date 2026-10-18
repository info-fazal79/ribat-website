import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LandingView } from "@/components/landing/section-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { getLandingPageMeta, getPublishedLandingPage } from "@/server/services/landing-pages";

// Landing pages are standalone (no storefront header/footer) for focused conversion.
export async function generateMetadata({ params }: PageProps<"/lp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getLandingPageMeta(slug);
  if (!meta) return {};
  return {
    title: meta.seoTitle ?? meta.title,
    description: meta.seoDescription ?? undefined,
    openGraph: meta.ogImageUrl ? { images: [meta.ogImageUrl] } : undefined,
  };
}

export default function LandingPage({ params }: PageProps<"/lp/[slug]">) {
  return (
    <main className="w-full flex-1">
      <Suspense fallback={<Skeleton className="m-4 h-96" />}>
        <LandingContent params={params} />
      </Suspense>
    </main>
  );
}

async function LandingContent({ params }: Pick<PageProps<"/lp/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getPublishedLandingPage(slug);
  if (!page) notFound();
  return <LandingView page={page} />;
}
