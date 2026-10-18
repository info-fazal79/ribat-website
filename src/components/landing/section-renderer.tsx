import type { LandingSection } from "@/lib/validations/landing-page";
import type { PublishedLandingPage } from "@/server/services/landing-pages";

/**
 * Maps each typed block to its component. Add a block by:
 *  1. adding its Zod schema to src/lib/validations/landing-page.ts
 *  2. adding a case here (TypeScript enforces exhaustiveness)
 */
export function SectionRenderer({ page }: { page: PublishedLandingPage }) {
  return (
    <>
      {page.sections.map((section) => (
        <Section key={section.id} section={section} page={page} />
      ))}
    </>
  );
}

function Section({ section, page }: { section: LandingSection; page: PublishedLandingPage }) {
  switch (section.type) {
    case "hero":
      return (
        <section className="px-4 py-16 text-center">
          <h1 className="font-bengali text-4xl font-semibold">{section.props.headline}</h1>
          {section.props.subheadline && <p className="mt-3 text-muted-foreground">{section.props.subheadline}</p>}
        </section>
      );
    case "benefits":
    case "gallery":
    case "reviews":
    case "faq":
    case "countdown":
    case "richText":
    case "checkout":
      // TODO(landing): implement block components in src/components/landing/blocks/
      return (
        <section className="border-y border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          [{section.type} block — {page.product.name}]
        </section>
      );
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}
