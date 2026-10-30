import Link from "next/link";
import { client } from "@/client.config";
import { auxRoutes, nav } from "@/lib/routes";

/**
 * Top bar: the name as the wordmark (no logo yet, so none is drawn),
 * the in-page anchors and a Call now button that dials Matt's phone.
 * Sticks on scroll, on bg with a line rule.
 */
export function SiteNav() {
  return (
    <header className="sg-navbar">
      <div className="section sg-nav">
        <Link href="/" className="sg-nav-mark">
          {client.businessName}
        </Link>
        <div className="sg-nav-right">
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
          <a
            href={`tel:${client.phoneHref}`}
            className="sg-btn sg-btn-primary sg-btn-sm sg-nav-call"
            aria-label={`Call now, ${client.phone}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call now
          </a>
        </div>
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
