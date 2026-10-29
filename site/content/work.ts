/**
 * ════════════════════════════════════════════════════════════════════
 *  THE WORK — every editable slot on the Signal one-pager.
 *
 *  Four shapes, matching the CMS model in the Signal design system:
 *    showreel   the hero screen
 *    category   a section head (title, blurb, order)
 *    project    a card in a category's rail
 *    ticker     the marquee words
 *
 *  A new project only needs a title, a label, a thumbnail, a runtime
 *  and a Vimeo link to slot in.
 *
 *  ── WHERE THE VIDEOS LIVE ───────────────────────────────────────────
 *  On Matt's Vimeo account. Each `vimeo` field takes the video's link
 *  exactly as Vimeo's Share button gives it:
 *    https://vimeo.com/123456789               (public)
 *    https://vimeo.com/123456789/abc123def4    (unlisted: keep the hash)
 *  Left empty, the card opens its still with a "coming soon" note.
 *  In Vimeo, set each video's embed privacy to allow this domain.
 *  Only the 12-second hero loop ships with the site, in public/work/.
 * ════════════════════════════════════════════════════════════════════
 */

export type Format = "4K" | "HD";

export type Project = {
  title: string;
  /** Type label under the title: "Logo sting", "Docu-style"… */
  label: string;
  /** 16:9 still from the piece itself, under public/. */
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

/**
 * Player URL for a Vimeo link, or "" if the link is empty or not one
 * we recognise. dnt=1 tells Vimeo not to track the viewer.
 */
export function vimeoEmbed(link: string): string {
  const m = link.trim().match(/(?:vimeo\.com\/(?:video\/)?)?(\d{6,})(?:\/([a-f0-9]{6,}))?(?:\?h=([a-f0-9]+))?/i);
  if (!m) return "";
  const hash = m[2] || m[3];
  const q = new URLSearchParams({ autoplay: "1", dnt: "1", title: "0", byline: "0", portrait: "0", color: "ff4d1f" });
  if (hash) q.set("h", hash);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

export const showreel = {
  /** Muted loop in the hero. Small enough to ship with the site. */
  loop: "/work/reel-loop.mp4",
  poster: "/work/reel-poster.jpg",
  /** Full reel with sound on Vimeo, opened by the play button. */
  vimeo: "https://vimeo.com/1232085839/63dcf087a9",
  runtime: "0:59",
  year: "2026",
  /** The loop starts this many seconds into the reel; keeps the timecode honest. */
  loopOffset: 6,
};

export const ticker = ["Logo Animation", "Documentary", "Motion Graphics", "Humor"];

export const categories: Category[] = [
  {
    id: "logo",
    title: "Logo Animation",
    blurb: "Short stings that make a mark move the way the brand feels.",
    projects: [
      { title: "Clearway", label: "Logo sting", thumb: "/work/logo-clearway.jpg", vimeo: "https://vimeo.com/1240999701/ba4d0c8fe8", runtime: "0:11", format: "4K" },
      { title: "DE&I", label: "Logo sting", thumb: "/work/logo-dei.jpg", vimeo: "https://vimeo.com/1240999793/cd266e6f94", runtime: "0:15", format: "4K" },
      { title: "Jump in with Josh", label: "Series open", thumb: "/work/logo-josh.jpg", vimeo: "https://vimeo.com/1240999702/1225ba8870", runtime: "0:04", format: "4K" },
    ],
  },
  {
    id: "doc",
    title: "Documentary",
    blurb: "Interview-led stories shot and cut with real people in real places.",
    projects: [
      { title: "Home Health Ridealong: Olivia, PT", label: "Docu-style", thumb: "/work/doc-olivia.jpg", vimeo: "https://vimeo.com/1241000010/d63282c4ed", runtime: "4:17", format: "4K" },
      { title: "Home Health Ridealong: Alison, OT", label: "Docu-style", thumb: "/work/doc-alison.jpg", vimeo: "https://vimeo.com/1241000011/104519de88", runtime: "3:45", format: "4K" },
      { title: "LHC Group", label: "Employer brand", thumb: "/work/doc-lhc.jpg", vimeo: "https://vimeo.com/1241000121/119fb18ffa", runtime: "2:41", format: "4K" },
    ],
  },
  {
    id: "motion",
    title: "Motion Graphics",
    blurb: "Explainers, data and character work built to hold attention.",
    projects: [
      { title: "2024 Year in Review", label: "Data motion", thumb: "/work/mo-numbers.jpg", vimeo: "https://vimeo.com/1240998353/c0a5109e9f", runtime: "1:16", format: "4K" },
      { title: "Lo-fi beats to document drive to", label: "Animated loop", thumb: "/work/mo-lofi.jpg", vimeo: "https://vimeo.com/1240998631/70289e8902", runtime: "8:00", format: "4K" },
      { title: "Cajun Grocer", label: "Character spot", thumb: "/work/mo-grocer.jpg", vimeo: "https://vimeo.com/1240998222/69ddb1b15c", runtime: "0:30", format: "HD" },
    ],
  },
  {
    id: "humor",
    title: "Humor",
    blurb: "Comedy spots and parodies played with a straight face.",
    projects: [
      { title: "Make Sense: Hastings", label: "Comedy spot", thumb: "/work/hu-hastings.jpg", vimeo: "https://vimeo.com/1240999190/eff3c4cda3", runtime: "0:15", format: "4K" },
      { title: "Make Sense: Dancing", label: "Comedy spot", thumb: "/work/hu-dancing.jpg", vimeo: "https://vimeo.com/1240999191/767fd571e9", runtime: "0:15", format: "4K" },
      { title: "Compliance's Most Wanted", label: "Parody short", thumb: "/work/hu-compliance.jpg", vimeo: "https://vimeo.com/1240999127/9122186543", runtime: "2:59", format: "4K" },
    ],
  },
];
