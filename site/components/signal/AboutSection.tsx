import { about } from "@/content/about";

/**
 * About: the headshot with name and title underneath on the left,
 * the heading and a few short paragraphs on the right. All of it comes
 * from content/about.json, which Matt edits in Pages CMS.
 */
export function AboutSection() {
  return (
    <section id="about" className="section sg-about" data-wipe aria-labelledby="about-h">
      <figure className="sg-about-fig">
        <span className="sg-about-shot sg-scan">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={about.headshot} alt={about.headshotAlt || about.name} width={960} height={1200} loading="lazy" />
        </span>
        <figcaption>
          <span className="sg-about-name">{about.name}</span>
          {about.title && <span className="sg-label">{about.title}</span>}
        </figcaption>
      </figure>
      <div className="sg-about-copy">
        <span className="sg-label sg-signal sg-glow">About</span>
        <h2 id="about-h">{about.heading}</h2>
        {about.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
