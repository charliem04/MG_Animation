"use client";

/**
 * The category sections, each a display head with a one-line blurb
 * over its ProjectCards. A card opens its video in the lightbox on
 * this page.
 *
 * Up to three videos sit in a row at a fixed size. A fourth turns the
 * section into a looping carousel (WorkCarousel) with arrows and dots,
 * so adding videos in the CMS never shrinks the cards.
 *
 * Narrower screens fit fewer cards (two on tablets, one on phones), so
 * there a section becomes a carousel as soon as it has more videos
 * than fit. The page first renders the desktop rows, then switches
 * once it knows the screen width.
 */
import { useCallback, useEffect, useState } from "react";
import { categories, vimeoEmbed, type Project } from "@/content/work";
import { VideoLightbox, type LightboxItem } from "./VideoLightbox";
import { WorkCarousel } from "./WorkCarousel";

/**
 * How many cards fit side by side. Matches the --per breakpoints on
 * .sg-carousel in globals.css. More videos than this and the section
 * becomes a carousel.
 */
function usePerView(): number {
  const [per, setPer] = useState(3);
  useEffect(() => {
    const phone = matchMedia("(max-width: 520px)");
    const tablet = matchMedia("(max-width: 820px)");
    const update = () => setPer(phone.matches ? 1 : tablet.matches ? 2 : 3);
    update();
    phone.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);
  return per;
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: (p: Project) => void }) {
  return (
    <button
      type="button"
      className="sg-card"
      onClick={() => onOpen(p)}
      aria-label={`Play ${p.title}, ${p.label}, ${p.runtime}`}
    >
      <span className="sg-thumb sg-scan">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.thumb} alt="" loading="lazy" width={640} height={360} />
        <span className="sg-split sg-split-r" style={{ backgroundImage: `url(${p.thumb})` }} aria-hidden="true" />
        <span className="sg-split sg-split-b" style={{ backgroundImage: `url(${p.thumb})` }} aria-hidden="true" />
        <span className="sg-tag sg-tag-fmt">{p.format}</span>
        <span className="sg-tag sg-tag-rt">{p.runtime}</span>
      </span>
      <span className="sg-card-meta">
        <span className="sg-card-title">{p.title}</span>
        <span className="sg-label">{p.label}</span>
      </span>
    </button>
  );
}

export function WorkSections() {
  const [open, setOpen] = useState<LightboxItem | null>(null);
  const perView = usePerView();
  const close = useCallback(() => setOpen(null), []);
  const onOpen = useCallback(
    (p: Project) =>
      setOpen({ title: p.title, label: p.label, src: vimeoEmbed(p.vimeo), poster: p.thumb, runtime: p.runtime }),
    []
  );

  return (
    <section id="work" className="section sg-work" aria-label="Work">
      {categories.map((cat) => (
        <div key={cat.id} data-wipe aria-labelledby={`cat-${cat.id}`} role="region">
          <div className="sg-cat">
            <h2 id={`cat-${cat.id}`}>{cat.title}</h2>
            <p>{cat.blurb}</p>
          </div>
          {cat.projects.length > perView ? (
            <WorkCarousel
              items={cat.projects}
              label={cat.title}
              itemKey={(p) => p.title}
              itemLabel={(p) => p.title}
              render={(p) => <ProjectCard p={p} onOpen={onOpen} />}
            />
          ) : (
            <ul className="sg-rail">
              {cat.projects.map((p) => (
                <li key={p.title}>
                  <ProjectCard p={p} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <VideoLightbox item={open} onClose={close} />
    </section>
  );
}
