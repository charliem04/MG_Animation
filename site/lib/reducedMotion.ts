"use client";

/**
 * Does this visitor want motion? The phone or computer's "reduce
 * motion" setting, read live, so changing it takes effect without a
 * reload.
 *
 * The static HTML is always the moving version (there is no visitor at
 * build time), so both hooks report false on the server and on the
 * first client render. That keeps the first render identical to the
 * HTML being hydrated; the real answer arrives one render later. The
 * prefers-reduced-motion block in app/globals.css covers that one
 * frame, so a reduced-motion visitor never sees movement.
 */
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when the visitor has asked for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
