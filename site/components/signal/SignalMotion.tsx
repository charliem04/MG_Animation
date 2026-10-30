"use client";

/**
 * The slice wipe: each [data-wipe] section below the fold wipes in
 * left to right behind a glowing scan line as it comes up the screen,
 * and its heading glitches as the line passes (styles in globals.css). Armed
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
    // can carry a section from below the fold into view in one frame,
    // and a check on every scroll catches that reliably.
    let pending = targets;
    let raf = 0;
    const check = () => {
      raf = 0;
      // While a video is open or fullscreen, the page behind it gets
      // locked, resized and scrolled by the browser. None of that is the
      // visitor scrolling, so the wipes wait until the video closes.
      if (videoUp()) return;
      // Fire once the section's top is a fifth of the way up the screen,
      // so the wipe plays where people are looking, not at the very edge.
      // A section that's already scrolled past (bottom above the screen)
      // stays armed and wipes in when the visitor scrolls back to it.
      const line = window.innerHeight * 0.8;
      pending = pending.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.top > line || r.bottom <= 0) return true;
        el.classList.remove("sg-armed");
        el.classList.add("sg-in");
        return false;
      });
      if (!pending.length) stop();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const stop = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Phones resize the viewport as the address bar slides away.
    window.addEventListener("resize", onScroll, { passive: true });
    return stop;
  }, []);
  return null;
}

/** A video lightbox is open (VideoLightbox sets the flag) or anything is fullscreen. */
function videoUp(): boolean {
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return (
    document.documentElement.hasAttribute("data-video-open") ||
    Boolean(document.fullscreenElement || d.webkitFullscreenElement)
  );
}
