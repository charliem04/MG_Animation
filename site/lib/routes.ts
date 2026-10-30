/**
 * ════════════════════════════════════════════════════════════════════
 *  ROUTE REGISTRY — one source of truth for nav, footer and sitemap.
 *
 *  `live: false` marks a route that is planned but not built yet
 *  (phase 2). Nothing links to a route that is not live, and the
 *  sitemap never lists one — so the nav, the footer and the sitemap
 *  cannot drift apart from what actually exists.
 *
 *  A parent whose children are all not-live renders as a plain link to
 *  its own `href`. When phase 2 lands, flipping `live` to true is what
 *  makes the dropdown appear.
 * ════════════════════════════════════════════════════════════════════
 */

export type RouteNode = {
  href: string;
  label: string;
  live: boolean;
  children?: RouteNode[];
  /** Sitemap weight for live routes. */
  priority?: number;
  /**
   * A page that exists and is linked, but should not be indexed — the
   * legal pages. It stays out of the sitemap AND sends noindex, from
   * this one flag, because a sitemap entry is a request to index and
   * listing a noindex page asks Google for two contradictory things.
   * Search Console reports it as "Excluded by noindex", which is noise
   * that hides real coverage problems.
   */
  noindex?: boolean;
};

/**
 * ── THE TREE ────────────────────────────────────────────────────────
 *
 * Signal is a one-page portfolio, so the nav is in-page anchors plus
 * the Call now button (SiteNav in components/signal/SiteChrome.tsx).
 * Anchors stay out of the sitemap; the legal pages below are the only
 * other routes. A future page goes here with `live` as its switch.
 * ────────────────────────────────────────────────────────────────────
 */
export const nav: RouteNode[] = [
  { href: "/#reel", label: "Reel", live: true },
  { href: "/#work", label: "Work", live: true },
  { href: "/#about", label: "About", live: true },
  { href: "/#contact", label: "Contact", live: true },
];

/** Routes that exist but are not top-level nav items. */
export const auxRoutes: RouteNode[] = [
  { href: "/terms/", label: "Terms of service", live: true, noindex: true },
  { href: "/privacy/", label: "Privacy policy", live: true, noindex: true },
];

/**
 * Should this path be indexed? False for a route that is not built and
 * for one flagged `noindex`. The pages read this for their own robots
 * meta, so the tag and the sitemap can never disagree.
 */
export function isIndexable(href: string): boolean {
  for (const node of [...nav, ...auxRoutes]) {
    if (node.href === href) return node.live && !node.noindex;
    const child = node.children?.find((c) => c.href === href);
    if (child) return child.live && !child.noindex;
  }
  return false;
}

/**
 * Every path the sitemap should list. Anchors, dead routes and
 * noindex pages out — a sitemap is a request to index, so listing a
 * page that refuses indexing asks for two opposite things at once.
 */
export function livePaths(): { path: string; priority: number }[] {
  const out: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
  ];
  const walk = (nodes: RouteNode[]) => {
    for (const n of nodes) {
      if (n.live && !n.noindex && !n.href.includes("#")) {
        out.push({ path: n.href, priority: n.priority ?? 0.5 });
      }
      if (n.children) walk(n.children);
    }
  };
  walk(nav);
  walk(auxRoutes);
  return out;
}
