"use client";

/**
 * The slice wipe: each [data-wipe] section below the fold wipes in
 * horizontally as it enters, and its heading jitters a frame. Armed
 * only once JavaScript runs, so a failed bundle never leaves anything
 * hidden, and skipped under prefers-reduced-motion.
 *
 * The power-on (the page opening from a 1px line) isn't here: it has
 * to start before the first paint, so it's a script in app/layout.tsx.
 */
import { useEffect } from "react";

export function SignalMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-wipe]")).filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight
    );
    if (!targets.length) return;
    targets.forEach((el) => el.classList.add("sg-armed"));

    // A scroll check rather than an IntersectionObserver: a nav jump
    // can carry a section from below the fold to above it in one frame,
    // and an observer never reports that one as intersecting, so it
    // would stay hidden. Anything at or above the line gets revealed.
    let pending = targets;
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = window.innerHeight * 0.88;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > line) return true;
        el.classList.remove("sg-armed");
        el.classList.add("sg-in");
        return false;
      });
      if (!pending.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
