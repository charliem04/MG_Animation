"use client";

/**
 * Signal's two orchestrated moves, armed only once JavaScript runs so a
 * failed bundle never leaves anything hidden:
 *   - power-on: the page opens from a 1px line, once per load
 *   - slice wipe: each [data-wipe] section below the fold wipes in
 *     horizontally as it enters, and its heading jitters a frame
 * Both are skipped under prefers-reduced-motion.
 */
import { useEffect } from "react";

export function SignalMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.getElementById("sg-screen");
    if (root && !sessionStorageSeen()) {
      root.classList.add("sg-power");
      root.addEventListener("animationend", () => root.classList.remove("sg-power"), { once: true });
    }

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

/** Power-on plays once per visit, not on every client-side navigation. */
function sessionStorageSeen(): boolean {
  try {
    if (sessionStorage.getItem("sg-powered")) return true;
    sessionStorage.setItem("sg-powered", "1");
  } catch {
    /* storage blocked: just play it */
  }
  return false;
}
