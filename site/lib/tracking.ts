/**
 * ════════════════════════════════════════════════════════════════════
 *  CONVERSION TRACKING
 *
 *  Did someone tap call or text, or send the form. Forwarded to
 *  Plausible if it is loaded. It is only loaded after cookie consent,
 *  so declining consent means these are silent no-ops. Nothing is
 *  stored or sent by this module itself.
 *
 *  Nothing here fires without a real user gesture, and no event carries
 *  anything identifying — just which action, on which page.
 * ════════════════════════════════════════════════════════════════════
 */

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

export type ConversionEvent = "Call" | "Text" | "Form submit";

export function trackEvent(
  event: ConversionEvent,
  props: Record<string, string> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, {
      props: { path: window.location.pathname, ...props },
    });
  } catch {
    // Analytics must never break a phone call.
  }
}
