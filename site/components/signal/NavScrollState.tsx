"use client";

/**
 * Two things that follow the scroll, both in the nav bar:
 *
 *  · the thin orange progress bar along the bar's bottom edge, which
 *    fills left to right as you move down the page;
 *  · which section link is lit. The link for the section you're in
 *    gets aria-current="location" (styled in globals.css).
 *
 * Both are read on scroll, once per frame at most, and written straight
 * to the DOM so the nav never re-renders. Lenis (SmoothScroll) moves
 * the real window scroll, so ordinary scroll events see its motion.
 *
 * "The section you're in" is the last one whose top has passed 40% of
 * the way down the screen, and the last section once the page is
 * scrolled to the bottom (Contact is too short to reach that line on
 * tall screens). On pages without the sections, no link is lit.
 */
import { useEffect, useRef } from "react";

export function NavScrollState() {
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.sg-nav-links a[href^="/#"]'));
    const targets = links
      .map((a) => ({ a, el: document.getElementById(a.getAttribute("href")!.slice(2)) }))
      .filter((t): t is { a: HTMLAnchorElement; el: HTMLElement } => !!t.el);

    let frame = 0;
    let current: HTMLAnchorElement | null = null;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      if (bar.current) {
        const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        bar.current.style.transform = `scaleX(${p})`;
      }

      let next: HTMLAnchorElement | null = null;
      if (targets.length) {
        const line = window.innerHeight * 0.4;
        for (const t of targets) if (t.el.getBoundingClientRect().top <= line) next = t.a;
        if (max > 0 && y >= max - 2) next = targets[targets.length - 1].a;
      }
      if (next !== current) {
        current?.removeAttribute("aria-current");
        next?.setAttribute("aria-current", "location");
        current = next;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Images, the form's sent panel and fonts change the page height.
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      current?.removeAttribute("aria-current");
    };
  }, []);

  return <span ref={bar} className="sg-progress" aria-hidden="true" />;
}
