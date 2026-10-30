"use client";

/**
 * Full-frame player for a project or the full reel, on the same page.
 * Traps focus, closes on Escape or a click on the backdrop, and hands
 * focus back to whatever opened it.
 *
 * The video plays in Vimeo's player (src is a player.vimeo.com URL
 * from vimeoEmbed in content/work.ts). A project with no Vimeo link
 * yet shows its still and says so, rather than an empty player.
 */
import { useEffect, useRef } from "react";

export type LightboxItem = {
  title: string;
  label: string;
  src: string;
  poster: string;
  runtime: string;
};

export function VideoLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    // Tells SignalMotion to hold the section wipes while a video is up.
    document.documentElement.setAttribute("data-video-open", "");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      opener?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title}, ${item.label}`}
      className="sg-lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sg-lightbox-frame">
        <div className="sg-lightbox-bar">
          <div>
            <p className="sg-card-title" style={{ margin: 0 }}>{item.title}</p>
            <span className="sg-label">
              {item.label} · <span className="sg-tc">{item.runtime}</span>
            </span>
          </div>
          <button ref={closeRef} type="button" className="sg-btn sg-btn-ghost sg-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sg-reel sg-lightbox-screen">
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
