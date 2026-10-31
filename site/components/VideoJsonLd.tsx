import { client } from "@/client.config";
import { showreel, categories, vimeoEmbed } from "@/content/work";

/**
 * VideoObject structured data for the showreel and every video card,
 * built from content/work.json so it follows Matt's CMS edits. It tells
 * search engines what each video is, which helps them show up in video
 * results. Cards with no Vimeo link yet are left out.
 *
 * uploadDate is the card's "Date added" field in the CMS.
 */

/** "4:17" → "PT4M17S". */
function isoDuration(runtime: string): string {
  const [m, s] = runtime.split(":").map(Number);
  return `PT${m}M${s}S`;
}

const abs = (path: string) => (path.startsWith("http") ? path : client.siteUrl + path);

export function VideoJsonLd() {
  const videos = [
    {
      name: `${client.businessName} showreel ${showreel.year}`,
      description: `A one-minute reel of logo animation, documentary and motion graphics work by ${client.businessName}.`,
      thumb: showreel.poster,
      vimeo: showreel.vimeo,
      runtime: showreel.runtime,
      added: showreel.added,
    },
    ...categories.flatMap((c) =>
      c.projects.map((p) => ({
        name: p.title,
        description: `${p.label} by ${client.businessName}. ${c.blurb}`,
        thumb: p.thumb,
        vimeo: p.vimeo,
        runtime: p.runtime,
        added: p.added,
      }))
    ),
  ].filter((v) => vimeoEmbed(v.vimeo));

  const data = {
    "@context": "https://schema.org",
    "@graph": videos.map((v) => ({
      "@type": "VideoObject",
      name: v.name,
      description: v.description,
      thumbnailUrl: abs(v.thumb),
      uploadDate: v.added,
      duration: isoDuration(v.runtime),
      embedUrl: vimeoEmbed(v.vimeo, false),
      creator: { "@type": "Person", name: client.businessName, url: client.siteUrl },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
