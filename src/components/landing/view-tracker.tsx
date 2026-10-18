"use client";

import { useEffect } from "react";
import { trackLandingView } from "@/app/lp/[slug]/actions";

/** Counts one view per landing page per browser session. */
export function ViewTracker({ landingPageId }: { landingPageId: string }) {
  useEffect(() => {
    const key = `ribat:lp-view:${landingPageId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked — still count once for this page load.
    }
    void trackLandingView(landingPageId);
  }, [landingPageId]);
  return null;
}
