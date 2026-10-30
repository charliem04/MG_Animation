"use client";

/**
 * The category sections, each a display head with a one-line blurb
 * over its ProjectCards. A card opens its video in the lightbox on
 * this page.
 *
 * Up to three videos sit in a row at a fixed size. A fourth turns the
 * section into a looping carousel (WorkCarousel) with arrows and dots,
 * so adding videos in the CMS never shrinks the cards.
 */
import { useCallback, useState } from "react";
import { categories, vimeoEmbed, type Project } from "@/content/work";
import { VideoLightbox, type LightboxItem } from "./VideoLightbox";
import { WorkCarousel } from "./WorkCarousel";

/** More videos than this and the section becomes a carousel. */
const ROW_MAX = 3;

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
          {cat.projects.length > ROW_MAX ? (
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
