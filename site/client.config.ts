/**
 * ════════════════════════════════════════════════════════════════════
 *  SITE SETTINGS: the facts about the business and the copy around
 *  the contact form. Edited in code, not in the CMS.
 *
 *  What Matt edits in Pages CMS lives in content/*.json instead: the
 *  hero (hero.json), the showreel and video cards (work.json), the About
 *  section (about.json) and the terms of service (terms.json).
 *
 *  Two things are switched off until Matt supplies them. The README's
 *  "Waiting on Matt" section has the steps for each:
 *    · logoPath: empty, so the nav shows his name as the wordmark.
 *    · socials: only Vimeo is set, and no social links appear on the
 *      page; the URLs are listed for search engines only.
 * ════════════════════════════════════════════════════════════════════
 */

export const client = {
  // ── Identity ──────────────────────────────────────────────────────
  businessName: "Matt Guidry",
  /** Printed in the footer copyright and the terms. Swap for the LLC name if he trades under one. */
  legalName: "Matt Guidry",
  /**
   * The nav logo. Empty = his name as a text wordmark (what the site
   * shows now). Set to e.g. "/brand/logo.svg" once the file is in
   * public/brand/, and the nav draws it instead (SiteNav, in
   * components/signal/SiteChrome.tsx).
   */
  logoPath: "",
  /** schema.org type for the structured data in components/JsonLd.tsx. */
  schemaType: "ProfessionalService",

  // ── Domain / SEO ──────────────────────────────────────────────────
  siteUrl: "https://mattjyguidry.tv", // no trailing slash; keep linkOnly in scripts/csp.mjs in step
  /** The build fails over 60 characters (title) or 160 (description). */
  metaTitle: "Matt Guidry — Video & Animation, Louisiana",
  metaDescription:
    "Logo animation, documentary and motion graphics by Matt Guidry, a Louisiana video producer. Watch the showreel, then send a project brief.",
  ogImagePath: "/brand/og.jpg", // 1200×630, made from the reel poster in the Signal style

  // ── Contact ───────────────────────────────────────────────────────
  phone: "337-519-8025",
  phoneHref: "+13375198025",
  email: "mattjyg@gmail.com",
  address: {
    // Freelance, no public street address. Empty fields drop out of the structured data.
    street: "",
    city: "",
    region: "LA",
    postalCode: "",
  },

  // ── Socials ───────────────────────────────────────────────────────
  /**
   * Profile URLs. Empty = not listed. Today these only feed the
   * structured data search engines read (the "sameAs" list); nothing on
   * the page links to them yet. When adding one, also add its origin to
   * linkOnly in scripts/csp.mjs or the build stops and asks.
   */
  socials: {
    facebook: "",
    instagram: "",
    /** Matt's Vimeo profile. */
    vimeo: "https://vimeo.com/user22033747",
    linkedin: "",
    /** A Google Business Profile link, if he makes one. */
    google: "",
  },

  // ── Brief form choices ────────────────────────────────────────────
  form: {
    /** Chips on the brief form; several can be picked. */
    serviceOptions: ["Logo animation", "Documentary", "Motion graphics", "Something else"],
    budgetOptions: ["Under $1k", "$1k–$3k", "$3k–$8k", "$8k+"],
    /**
     * "Needed by" chips; one can be picked. The form adds a last chip,
     * timelineCustomLabel, that opens a text box for a specific date.
     */
    timelineOptions: ["ASAP (1–2 weeks)", "Within a month", "1–3 months", "3+ months", "Flexible"],
    timelineCustomLabel: "Specific date",
  },

  // ── Copy ──────────────────────────────────────────────────────────
  copy: {
    /** Printed in the footer. */
    utilityBar: "Louisiana · Available remote",
    contactEyebrow: "Booking for 2026–27",
    contactHeading: "Got a story to cut?",
    contactLede:
      "Tell me what you're making and when it needs to ship. I usually reply the same day.",
    contactSubmit: "Send project brief",
    contactConfirmation: "Got it. I'll reply within a day.",
    // The panel that replaces the form once a brief is sent.
    contactSentEyebrow: "Transmission received",
    contactNextSteps: [
      { title: "I read your brief", body: "And watch anything you've linked, usually the same day." },
      { title: "I reply with questions", body: "Or a time to talk it through on the phone." },
      { title: "You get a quote and a schedule", body: "With dates worked back from your deadline." },
    ],
  },
} as const;

export type ClientConfig = typeof client;
