import Link from "next/link";
import { client } from "@/client.config";
import { auxRoutes, nav } from "@/lib/routes";

/**
 * Top bar: the name as the wordmark (no logo yet, so none is drawn)
 * and three in-page anchors. Sticks on scroll, on bg with a line rule.
 */
export function SiteNav() {
  return (
    <header className="sg-navbar">
      <div className="section sg-nav">
        <Link href="/" className="sg-nav-mark">
          {client.businessName}
        </Link>
        <nav aria-label="Sections">
          <ul className="sg-nav-links">
            {nav
              .filter((n) => n.live)
              .map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="section">
      <div className="sg-foot sg-label">
        <span>
          © {year} {client.legalName}
        </span>
        <span>{client.copy.utilityBar}</span>
        <span style={{ display: "flex", gap: "var(--space-4)" }}>
          {auxRoutes
            .filter((r) => r.live)
            .map((r) => (
              <Link key={r.href} href={r.href}>
                {r.label}
              </Link>
            ))}
        </span>
      </div>
    </footer>
  );
}

/** The two channel filters the card hover split reads. Once per page. */
export function SplitFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="sg-only-r">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id="sg-only-b">
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      </filter>
    </svg>
  );
}
