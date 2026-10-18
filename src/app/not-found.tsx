import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-xs tracking-[0.3em] text-gold uppercase">404</p>
      <h1 className="text-4xl">Page not found</h1>
      <p className="font-bengali text-muted-foreground">দুঃখিত, পৃষ্ঠাটি খুঁজে পাওয়া যায়নি।</p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
