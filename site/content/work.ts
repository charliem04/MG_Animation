/**
 * ════════════════════════════════════════════════════════════════════
 *  THE WORK — every editable slot on the Signal one-pager.
 *
 *  The content itself lives in content/work.json, which Matt edits in
 *  Pages CMS (app.pagescms.org; the editor is defined in /.pages.yml at
 *  the repo root). Each save there is a commit, and Cloudflare rebuilds
 *  the site from it. This file only types that JSON, checks it, and
 *  turns Vimeo links into player URLs.
 *
 *  ── WHERE THE VIDEOS LIVE ───────────────────────────────────────────
 *  On Matt's Vimeo account. Each `vimeo` field takes the video's link
 *  exactly as Vimeo's Share button gives it:
 *    https://vimeo.com/123456789               (public)
 *    https://vimeo.com/123456789/abc123def4    (unlisted: keep the hash)
 *  Left empty, the card opens its still with a "coming soon" note.
 *  In Vimeo, set each video's embed privacy to allow this domain.
 *  Only the 12-second hero loop ships with the site, in public/work/.
 *
 *  ── IF THE BUILD FAILS HERE ─────────────────────────────────────────
 *  checkWork() below stops the build and names the entry when a save
 *  in the CMS leaves something the page can't show (no title, a bad
 *  runtime, a link that isn't Vimeo). Cloudflare then keeps the last
 *  good version live, so a typo never takes the site down.
 * ════════════════════════════════════════════════════════════════════
 */
import data from "./work.json";

export type Format = "4K" | "HD";

export type Project = {
  title: string;
  /** Type label under the title: "Logo sting", "Docu-style"… */
  label: string;
  /** 16:9 still from the piece itself, under public/work/. */
  thumb: string;
  /** Vimeo link (see above). */
  vimeo: string;
  /** Real runtime, m:ss. */
  runtime: string;
  format: Format;
};

export type Category = {
  id: string;
  title: string;
  blurb: string;
  projects: Project[];
};

const VIMEO_LINK = /(?:vimeo\.com\/(?:video\/)?)?(\d{6,})(?:\/([a-f0-9]{6,}))?(?:\?h=([a-f0-9]+))?/i;

/**
 * Player URL for a Vimeo link, or "" if the link is empty or not one
 * we recognise. dnt=1 tells Vimeo not to track the viewer.
 */
export function vimeoEmbed(link: string): string {
  const m = link.trim().match(VIMEO_LINK);
  if (!m) return "";
  const hash = m[2] || m[3];
  const q = new URLSearchParams({ autoplay: "1", dnt: "1", title: "0", byline: "0", portrait: "0", color: "ff4d1f" });
  if (hash) q.set("h", hash);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

function checkWork(d: typeof data) {
  const problems: string[] = [];
  const runtime = /^\d{1,2}:[0-5]\d$/;
  const vimeoOk = (v: string) => v === "" || (/vimeo\.com/i.test(v) && VIMEO_LINK.test(v));

  if (!runtime.test(d.showreel.runtime)) problems.push(`Showreel: runtime "${d.showreel.runtime}" should look like 0:59`);
  if (!vimeoOk(d.showreel.vimeo)) problems.push(`Showreel: "${d.showreel.vimeo}" is not a Vimeo link`);

  for (const c of d.categories) {
    if (!c.title.trim()) problems.push(`A section has no title`);
    for (const p of c.projects) {
      const where = `${c.title} → ${p.title || "(untitled)"}`;
      if (!p.title.trim()) problems.push(`${where}: no title`);
      if (!p.thumb) problems.push(`${where}: no thumbnail`);
      if (!runtime.test(p.runtime)) problems.push(`${where}: runtime "${p.runtime}" should look like 1:16`);
      if (p.format !== "4K" && p.format !== "HD") problems.push(`${where}: format must be 4K or HD`);
      if (!vimeoOk(p.vimeo)) problems.push(`${where}: "${p.vimeo}" is not a Vimeo link`);
    }
  }
  if (problems.length) {
    throw new Error(`[work] content/work.json needs fixing:\n  - ${problems.join("\n  - ")}`);
  }
}
checkWork(data);

export const showreel = {
  ...data.showreel,
  /** Muted loop in the hero. Small enough to ship with the site. */
  loop: "/work/reel-loop.mp4",
  /** The loop starts this many seconds into the reel; keeps the timecode honest. */
  loopOffset: 6,
};

export const ticker: string[] = data.ticker;

/** Section ids for anchors; derived from the title so the CMS never asks for one. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const categories: Category[] = data.categories.map((c) => ({
  ...c,
  id: slug(c.title),
  projects: c.projects as Project[],
}));
