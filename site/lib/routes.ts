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
 * Where every primary call to action goes.
 *
 * It used to be `client.bookingUrl || "/contact/"` at each button, so
 * the moment a scheduler URL existed every CTA on the site handed the
 * visitor to a third party mid-read — the nav, the hero, the sticky
 * bar, the call cards and the closing bands all at once. That is the
 * wrong default for someone who is still deciding, and it is not
 * something a booking URL should get to decide on its own.
 *
 * So the two are separated. `client.bookingUrl` now means one thing
 * only: which calendar the embed on /contact/ loads. Getting there is
 * this constant, and /contact/ carries every way in — the phone, the
 * urgent line, the request form and the calendar itself.
 */
export const CTA_HREF = "/#contact";

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
 * Is this path built yet? Home-page funnel links ask this before they
 * render, so flipping `live` in the registry is all it takes to switch
 * a phase-2 destination on across the whole site.
 */
export function isLive(href: string): boolean {
  for (const node of [...nav, ...auxRoutes]) {
    if (node.href === href) return node.live;
    const child = node.children?.find((c) => c.href === href);
    if (child) return child.live;
  }
  return false;
}

/** Children a nav item should actually render — live ones only. */
export function liveChildren(node: RouteNode): RouteNode[] {
  return (node.children ?? []).filter((c) => c.live);
}

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

/**
 * Breadcrumb trail for a path, derived from the registry.
 *
 * `leafLabel` is for a page the registry cannot know about by name — a
 * case study, or anything else generated per content item. Without it
 * such a page fell through to a one-entry trail, which <Breadcrumbs>
 * declines to render: no visible trail and, worse, no BreadcrumbList
 * schema on exactly the deep pages that most need one. With it, the
 * page is hung off the longest registered path that prefixes it.
 */
export function trailFor(
  path: string,
  leafLabel?: string
): { href: string; label: string }[] {
  const trail = [{ href: "/", label: "Home" }];

  for (const node of [...nav, ...auxRoutes]) {
    if (node.href === path) {
      trail.push({ href: node.href, label: node.label });
      return trail;
    }
    const child = node.children?.find((c) => c.href === path);
    if (child) {
      if (!node.href.includes("#")) {
        trail.push({ href: node.href, label: node.label });
      }
      trail.push({ href: child.href, label: child.label });
      return trail;
    }
  }

  if (!leafLabel) return trail;

  // No exact match: find the deepest registered ancestor. "/" is not a
  // candidate — it is already the first crumb.
  let best: RouteNode | undefined;
  let bestParent: RouteNode | undefined;
  for (const node of [...nav, ...auxRoutes]) {
    for (const cand of [node, ...(node.children ?? [])]) {
      if (cand.href === "/" || cand.href.includes("#")) continue;
      if (!path.startsWith(cand.href)) continue;
      if (best && cand.href.length <= best.href.length) continue;
      best = cand;
      bestParent = cand === node ? undefined : node;
    }
  }
  if (!best) return trail;

  if (bestParent && !bestParent.href.includes("#")) {
    trail.push({ href: bestParent.href, label: bestParent.label });
  }
  trail.push({ href: best.href, label: best.label });
  trail.push({ href: path, label: leafLabel });
  return trail;
}
