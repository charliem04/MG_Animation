"use client";

/**
 * One delegated listener for the actions that matter (call and text)
 * instead of an onClick on every button that offers them.
 *
 * Doing it here means a link added anywhere later is tracked without
 * anyone remembering to wire it, and no component has to import
 * analytics to render a phone number. Mounted once, in the layout.
 */
import { useEffect } from "react";
import { trackEvent, type ConversionEvent } from "@/lib/tracking";

function classify(href: string): ConversionEvent | null {
  if (href.startsWith("tel:")) return "Call";
  if (href.startsWith("sms:")) return "Text";
  return null;
}

export function InteractionTracking() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const event = classify(anchor.getAttribute("href") ?? "");
      if (!event) return;
      trackEvent(event);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
