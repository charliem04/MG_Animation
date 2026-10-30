"use client";

/**
 * Full-frame player for a project or the full reel, on the same page.
 * Traps focus, closes on Escape or a click on the backdrop, and hands
 * focus back to whatever opened it.
 *
 * The video plays in Vimeo's player (src is a player.vimeo.com URL
 * from vimeoEmbed in content/work.ts). A project with no Vimeo link
 * yet shows its still and says so, rather than an empty player.
 *
 * ── THE EXPAND ──────────────────────────────────────────────────────
 * The player grows out of the thumbnail that opened it (item.from) like
 * a CRT warming up: a brightness
 * flash, a red/blue split and scanlines that settle as it lands. Closing
 * plays it backwards into the same spot. Without a starting spot it
 * opens from a 1px line, like the page's own power-on. Skipped under
 * reduced motion.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type LightboxItem = {
  title: string;
  label: string;
  src: string;
  poster: string;
  runtime: string;
  /** The thumbnail that opened this; the player grows out of it. */
  from?: HTMLElement | null;
};

const OPEN_MS = 680;
const CLOSE_MS = 380;
// Quick off the mark, long gentle landing: the growth reads as one move.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Red/blue split and brightness as the screen "warms up". Every frame
// lists the same filter functions so the browser can blend between them.
const WARM = "brightness(2.2) drop-shadow(-7px 0 rgba(255,77,31,0.85)) drop-shadow(7px 0 rgba(111,155,255,0.85))";
const SETTLING = "brightness(1.2) drop-shadow(-2px 0 rgba(255,77,31,0.5)) drop-shadow(2px 0 rgba(111,155,255,0.5))";
const SETTLED = "brightness(1) drop-shadow(0 0 rgba(255,77,31,0)) drop-shadow(0 0 rgba(111,155,255,0))";

function reducedMotion() {
  return typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where the thumbnail is right now, or null if it's gone or hidden. */
function fromRect(el: LightboxItem["from"]): DOMRect | null {
  if (!el || !el.isConnected) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? r : null;
}

/** The transform that puts the player exactly over the thumbnail. */
function startTransform(screen: HTMLElement, el: LightboxItem["from"]): string {
  const to = screen.getBoundingClientRect();
  const from = fromRect(el);
  if (!from || !to.width) return "scale(0.6, 0.004)";
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`;
}

export function VideoLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  // Play the expand before the first paint, so the player never shows
  // at full size first.
  useLayoutEffect(() => {
    closing.current = false;
    const dialog = dialogRef.current;
    const screen = screenRef.current;
    if (!item || !dialog || !screen || reducedMotion()) return;
    const from = item.from;
    const hasFrom = Boolean(fromRect(from));
    screen.style.transformOrigin = hasFrom ? "0 0" : "50% 50%";
    screen.classList.add("sg-scan");
    // Two timelines: the growth eases across the whole open, and the
    // flash and split fade on their own, settling just as it lands.
    const grow = screen.animate(
      [
        { transform: startTransform(screen, from), opacity: hasFrom ? 1 : 0.6 },
        { transform: "none", opacity: 1 },
      ],
      { duration: OPEN_MS, easing: EASE }
    );
    screen.animate([{ filter: WARM }, { filter: SETTLING, offset: 0.65 }, { filter: SETTLED }], {
      duration: OPEN_MS,
      easing: "linear",
    });
    grow.finished.then(() => screen.classList.remove("sg-scan")).catch(() => {});
    dialog.animate([{ backgroundColor: "rgba(5,5,6,0)" }, { backgroundColor: "rgba(5,5,6,0.96)" }], {
      duration: OPEN_MS * 0.6,
      easing: "ease-out",
    });
    barRef.current?.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], {
      duration: 260,
      delay: OPEN_MS * 0.55,
      easing: "ease-out",
      fill: "backwards",
    });
  }, [item]);

  // Shrink back into the thumbnail, then actually close.
  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    const screen = screenRef.current;
    if (closing.current) return;
    if (!item || !dialog || !screen || reducedMotion()) {
      onClose();
      return;
    }
    closing.current = true;
    const hasFrom = Boolean(fromRect(item.from));
    screen.style.transformOrigin = hasFrom ? "0 0" : "50% 50%";
    screen.classList.add("sg-scan");
    const shrink = screen.animate(
      [
        { transform: "none", filter: SETTLED, opacity: 1 },
        { transform: startTransform(screen, item.from), filter: WARM, opacity: hasFrom ? 1 : 0 },
      ],
      { duration: CLOSE_MS, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" }
    );
    dialog.animate([{ backgroundColor: "rgba(5,5,6,0.96)" }, { backgroundColor: "rgba(5,5,6,0)" }], {
      duration: CLOSE_MS,
      fill: "forwards",
    });
    barRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
    shrink.finished.then(onClose, onClose);
  }, [item, onClose]);

  useEffect(() => {
    if (!item) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    // Tells SignalMotion to hold the section wipes while a video is up.
    document.documentElement.setAttribute("data-video-open", "");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const ring = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>("button, iframe")
      );
      if (!ring.length) return;
      const i = ring.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      ring[(i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length]?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-video-open");
      opener?.focus({ preventScroll: true });
    };
  }, [item, requestClose]);

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title}, ${item.label}`}
      className="sg-lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="sg-lightbox-frame">
        <div ref={barRef} className="sg-lightbox-bar">
          <div>
            <p className="sg-card-title" style={{ margin: 0 }}>{item.title}</p>
            <span className="sg-label">
              {item.label} · <span className="sg-tc">{item.runtime}</span>
            </span>
          </div>
          <button ref={closeRef} type="button" className="sg-btn sg-btn-ghost sg-btn-sm" onClick={requestClose}>
            Close
          </button>
        </div>
        <div ref={screenRef} className="sg-reel sg-lightbox-screen">
          {item.src ? (
            <iframe
              src={item.src}
              title={`${item.title} video`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.poster} alt="" />
              <p className="sg-lightbox-note">
                Full video coming soon.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
