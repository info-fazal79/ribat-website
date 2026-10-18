"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Meta Pixel base code + PageView. `pixelId` is validated as digits on save. */
export function FacebookPixel({ pixelId }: { pixelId: string }) {
  if (!/^\d{10,20}$/.test(pixelId)) return null;
  return (
    <Script id={`fb-pixel-${pixelId}`} strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}

/** Fires one Purchase event per order (guards against refresh double-counting). */
export function PixelPurchase({ orderNumber, value }: { orderNumber: string; value: number }) {
  useEffect(() => {
    const key = `ribat:pixel-purchase:${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }
    // fbq loads asynchronously; its stub queues calls made before the script arrives.
    const fire = () => window.fbq?.("track", "Purchase", { value, currency: "BDT", content_name: orderNumber });
    if (window.fbq) fire();
    else window.setTimeout(fire, 1500);
  }, [orderNumber, value]);
  return null;
}
