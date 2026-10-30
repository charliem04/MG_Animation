/**
 * ════════════════════════════════════════════════════════════════════
 *  CLIENT CONFIG — the ONLY file you should need to edit per client
 *  (plus swapping images in /public/brand and setting .env.local).
 *
 *  Every component reads from this file. If you find yourself editing
 *  a component to change client content, that content belongs here.
 *
 *  Every value below is a placeholder. Search this file for TODO before
 *  you ship — scripts/check.mjs does not know what a real phone number
 *  looks like, but a visitor does.
 *
 *  Longer-form content (services, gallery, careers, case studies) does
 *  NOT live here. It lives in content/*.ts behind lib/content.ts, so a
 *  CMS can replace it without touching a component. This file is for
 *  the facts about the business and the copy that frames them.
 * ════════════════════════════════════════════════════════════════════
 */

export type Testimonial = {
  quote: string;
  name: string;
  detail: string; // e.g. "Homeowner, Springfield" or "Fleet manager"
};

export const client = {
  // ── Identity ──────────────────────────────────────────────────────
  businessName: "Matt Guidry",
  legalName: "Matt Guidry", // TODO(client) — swap for the LLC name if he trades under one
  /**
   * The home-page hero reads content/hero.json (edited in Pages CMS),
   * not these; they remain for the template's older components.
   */
  tagline: "Matt Guidry",
  taglineEmphasis: "Video & Animation",
  subheadline:
    "Logo animation, documentary and motion graphics for brands, healthcare teams and local businesses.",
  logoPath: "/brand/logo.svg", // TODO(client) — real logo in public/brand/
  logoAlt: "Matt Guidry", // no logo yet: the nav sets the name as a wordmark

  /**
   * schema.org type for the LocalBusiness JSON-LD in components/JsonLd.tsx.
   *
   * Pick the most specific type that genuinely fits from
   * schema.org/LocalBusiness — "RoofingContractor", "Plumber",
   * "Electrician", "Dentist", "LegalService". Google reads this, and a
   * wrong specific type is worse than a correct general one, so fall
   * back to "LocalBusiness" rather than guessing.
   */
  schemaType: "ProfessionalService",

  // ── Domain / SEO ──────────────────────────────────────────────────
  siteUrl: "https://mattjyguidry.tv", // no trailing slash; keep linkOnly in scripts/csp.mjs in step
  /**
   * scripts/seo.mjs fails the build if a rendered title exceeds 60
   * characters or a description exceeds 160, because that is roughly
   * where Google truncates. Write to the limit, not past it.
   */
  metaTitle: "Matt Guidry — Video & Animation, Louisiana",
  metaDescription:
    "Logo animation, documentary and motion graphics by Matt Guidry, a Louisiana video producer. Watch the showreel, then send a project brief.",
  ogImagePath: "/brand/og.jpg", // 1200×630, made from the reel poster in the Signal style

  // ── Contact ───────────────────────────────────────────────────────
  phone: "337-519-8025",
  phoneHref: "+13375198025",
  /** Texts. Often the same number, different intent. */
  smsHref: "+13375198025",
  /**
   * A second line for urgent work, answered outside office hours.
   * Set both to "" to drop every urgent-line affordance on the site.
   */
  urgentPhone: "", // TODO(client) — optional
  urgentPhoneHref: "", // TODO(client) — optional
  email: "mattjyg@gmail.com",
  address: {
    // Freelance, no public street address. Empty fields drop out of the JSON-LD.
    street: "",
    city: "",
    region: "LA",
    postalCode: "",
  },
  hours: [
    { days: "Monday – Friday", time: "8am – 5pm" },
    { days: "Saturday", time: "Closed" },
    { days: "Sunday", time: "Closed" },
  ], // TODO(client)
  /** Short form of the hours, printed in the utility bar. */
  hoursShort: "Replies same day",
  /**
   * Google Maps embed URL. Maps → Share → Embed a map, and paste ONLY
   * the src attribute value here. Empty string = the map panel is
   * skipped rather than rendering an empty frame.
   *
   * INTEGRATIONS.frame in scripts/csp.mjs allows https://www.google.com
   * for this. With no map, delete that line too.
   */
  mapEmbedSrc: "",

  // ── Booking ───────────────────────────────────────────────────────
  /**
   * The calendar embedded in the booking band on /contact/, and
   * nothing else. Empty string drops that band (and the scheduler
   * paragraph in the privacy notice) — the page keeps the phone and
   * the request form.
   *
   * It is deliberately NOT where the buttons point. On the site this
   * was extracted from, every primary CTA read this URL, so one config
   * value quietly sent the whole site out to a third party mid-
   * decision. CTAs go to CTA_HREF in lib/routes.ts now, which lands on
   * /contact/ where this calendar lives. Changing the scheduler is a
   * change to one band on one page.
   *
   * The CSP drift check in scripts/csp.mjs fails the build if
   * frame-src does not name this origin, so swapping schedulers
   * announces itself rather than being silently blocked. Add the new
   * origin to INTEGRATIONS.frame there at the same time.
   *
   * Cal.com and Calendly are both already known to lib/booking.ts and
   * allowed in INTEGRATIONS.frame. For Cal.com paste the public booking
   * page URL (https://cal.com/<user>/<event>), not the embed snippet.
   */
  bookingUrl: "", // TODO(client) — e.g. https://cal.com/acme/estimate or https://calendly.com/…

  /**
   * Call tracking. Dynamic number insertion is the provider's own
   * script rewriting numbers in the page at runtime, so this is a URL,
   * not a number. Empty = every number on the site stays the real one
   * above, which is the correct state until a provider is chosen.
   * The script loads only after cookie consent, with the analytics.
   */
  tracking: {
    dniScriptUrl: "", // TODO(client) — e.g. CallRail's swap.js
  },

  // ── Socials (empty string hides the link) ─────────────────────────
  socials: {
    facebook: "",
    /**
     * Meta has no reviews API, so a link is the only route to
     * recommendations — a link, not a feed.
     */
    facebookReviews: "",
    instagram: "",
    /** Matt's Vimeo profile; also listed in the JSON-LD sameAs. */
    vimeo: "https://vimeo.com/user22033747",
    linkedin: "",
    /** Leaves a review. Get it from the Google Business Profile. */
    google: "",
  },

  // ── Contact form dropdowns ────────────────────────────────────────
  /**
   * The two <select> fields on the work-order sheet. Urgency is
   * required, so keep both lists short enough to scan. Order them the
   * way a dispatcher would read them, not alphabetically for its own
   * sake — the first service is the pre-selected one.
   */
  form: {
    /** Chips on the brief form; several can be picked. */
    serviceOptions: ["Logo animation", "Documentary", "Motion graphics", "Something else"],
    /** Kept for the template's older request form; the Signal form does not use it. */
    urgencyOptions: ["As soon as possible", "This month", "Just planning ahead"],
    budgetOptions: ["Under $1k", "$1k–$3k", "$3k–$8k", "$8k+"],
    /**
     * "Needed by" chips on the brief form; one can be picked. The form
     * adds a last chip, timelineCustomLabel, that opens a text box for
     * a specific date or deadline.
     */
    timelineOptions: ["ASAP (1–2 weeks)", "Within a month", "1–3 months", "3+ months", "Flexible"],
    timelineCustomLabel: "Specific date",
  },

  // ── About band (home page) ────────────────────────────────────────
  about: {
    heading: "", // unused on the Signal one-pager
    /** 1–3 short paragraphs, in the client's own words. */
    body: [
      "Who the business is, how long it has been doing this, and who actually shows up to do the work.",
      "What a customer can count on — the written price, the guarantee — stated only as far as the client stands behind it.",
    ], // TODO(client)
    photo: {
      src: "/brand/about.svg",
      alt: "", // TODO(client) — describe what is in the frame
      width: 1200,
      height: 900,
    },
    /**
     * Shop-door facts, printed as a ruled mono line. Real figures only —
     * scripts/check.mjs flags a row of suspiciously round numbers.
     * [] hides the row.
     */
    stats: [] as { value: string; label: string }[], // TODO(client)
    /** Places worked, printed as a mono tag row. [] hides the row. */
    towns: [] as string[], // TODO(client)
  },

  /** Photo printed beside the contact details column. */
  contactPhoto: {
    src: "/brand/photo.svg",
    alt: "", // TODO(client) — describe what is in the frame
    width: 1200,
    height: 652,
  },

  // ── Testimonials (set to [] to hide the section) ──────────────────
  // Real quotes only. A link to the review profile carries this weight
  // until the client supplies quotes cleared for the site.
  testimonials: [] as Testimonial[],

  // ── Trust badges (license #s, certs — set to [] to hide) ──────────
  badges: [] as { label: string; detail?: string }[],

  // ── Section copy (headings/CTAs) ──────────────────────────────────
  copy: {
    /** Printed in the footer. */
    utilityBar: "Louisiana · Available remote",
    heroCta: "Start a project",
    heroSecondaryCta: "See the work",
    heroFacts: [] as { value: string; label: string }[],
    navCta: "Start a project",
    servicesHeading: "",
    servicesLede: "",
    galleryHeading: "",
    galleryLede: "",
    testimonialsHeading: "",
    bookingHeading: "",
    bookingBlurb: "",
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
    closingHeading: "",
    closingBody: "",
    footerBlurb: "",
    stickyCtaLabel: "Start a project",
  },
} as const;

export type ClientConfig = typeof client;
