"use client";

/**
 * Hero: the name and meta row, then the showreel screen at full
 * content width — the largest thing on the page. A muted loop plays
 * under an on-screen display (rec dot, resolution, live timecode);
 * the play button opens the full reel with sound.
 *
 * The words come from content/hero.json, edited in Pages CMS.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "@/client.config";
import { showreel, vimeoEmbed } from "@/content/work";
import { hero } from "@/content/hero";
import { VideoLightbox, type LightboxItem } from "./VideoLightbox";

const pad = (n: number) => String(n).padStart(2, "0");

export function ReelHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState<LightboxItem | null>(null);
  const close = useCallback(() => setOpen(null), []);

  // Timecode follows the loop's currentTime, written straight to the
  // node so it never re-renders the hero 60 times a second.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      const t = (v?.currentTime ?? 0) + showreel.loopOffset;
      const f = Math.floor((t % 1) * 24);
      if (tcRef.current) {
        tcRef.current.textContent = `TC 00:${pad(Math.floor(t / 60))}:${pad(Math.floor(t) % 60)}:${pad(f)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pause the loop while the full reel plays over it.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) v.pause();
    else v.play().catch(() => {});
  }, [open]);

  return (
    <section id="reel" className="section sg-hero" aria-labelledby="hero-name">
      <div className="sg-hero-top">
        <h1 id="hero-name" className="sg-hero-name sg-ab">
          {hero.name}
          <span className="sg-l2">{hero.line2}</span>
        </h1>
        <div className="sg-hero-meta">
          <span className="sg-label sg-signal sg-glow">
            ▶ Showreel / {showreel.year} / {showreel.runtime.padStart(5, "0")}
          </span>
          <p>{hero.intro}</p>
          <div className="sg-actions">
            <a className="sg-btn sg-btn-primary" href="#contact">
              {hero.primaryButton}
            </a>
            <a className="sg-btn sg-btn-ghost" href="#work">
              {hero.secondaryButton}
            </a>
          </div>
        </div>
      </div>

      <div className="sg-reel sg-scan sg-vignette">
        <video
          ref={videoRef}
          src={showreel.loop}
          poster={showreel.poster}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="sg-roll" aria-hidden="true" />
        <div className="sg-osd">
          <div className="sg-osd-row">
            <span className="sg-rec">Live · Ch 03</span>
            <span>3840 × 2160</span>
          </div>
          <button
            type="button"
            className="sg-play"
            aria-label="Play the full showreel with sound"
            onClick={(e) =>
              setOpen({
                from: e.currentTarget.closest<HTMLElement>(".sg-reel"),
                title: `${client.businessName} — Showreel`,
                label: showreel.year,
                src: vimeoEmbed(showreel.vimeo),
                poster: showreel.poster,
                runtime: showreel.runtime,
              })
            }
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
            </svg>
          </button>
          <div className="sg-osd-row">
            <span ref={tcRef}>TC 00:00:00:00</span>
            <span>
              {client.businessName} · {showreel.year}
            </span>
          </div>
        </div>
      </div>

      <VideoLightbox item={open} onClose={close} />
    </section>
  );
}
