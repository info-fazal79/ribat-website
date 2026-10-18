import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionRenderer } from "@/components/landing/section-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedLandingPage } from "@/server/services/landing-pages";

// Landing pages are standalone (no storefront header/footer) for focused conversion.
export async function generateMetadata({ params }: PageProps<"/lp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedLandingPage(slug);
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    openGraph: page.ogImageUrl ? { images: [page.ogImageUrl] } : undefined,
  };
}

export default function LandingPage({ params }: PageProps<"/lp/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1">
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
  return <SectionRenderer page={page} />;
}
