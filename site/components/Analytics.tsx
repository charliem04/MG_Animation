"use client";

/**
 * Consent-gated analytics stub (Plausible). Loads ONLY after the
 * visitor accepts cookies, and only if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is
 * set.
 */
import { useEffect, useState } from "react";
import { getConsent, CONSENT_EVENT } from "@/lib/consent";

const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export function Analytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!DOMAIN) return;
    const check = () => setEnabled(getConsent() === "accepted");
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (DOMAIN && !document.querySelector("script[data-analytics]")) {
      const s = document.createElement("script");
      s.defer = true;
      s.dataset.analytics = "true";
      s.dataset.domain = DOMAIN;
      s.src = "https://plausible.io/js/script.js";
      document.head.appendChild(s);
    }
  }, [enabled]);

  return null;
}
