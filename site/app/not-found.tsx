import Link from "next/link";
import { client } from "@/client.config";

export const metadata = {
  title: `Page not found | ${client.businessName}`,
};

/**
 * No signal: hand back the home page and the phone, since most people
 * who land here were trying to reach Matt or see the reel.
 */
export default function NotFound() {
  return (
    <section className="section" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div style={{ paddingBlock: "var(--space-8)", display: "grid", gap: "var(--space-4)" }}>
        <span className="sg-label sg-signal sg-glow">No signal · Error 404</span>
        <h1 className="sg-ab" style={{ margin: 0, fontSize: "clamp(32px, 6vw, 72px)", lineHeight: 0.92, maxWidth: "16ch" }}>
          That page isn’t on this channel
        </h1>
        <p className="sg-dim" style={{ margin: 0, maxWidth: "52ch" }}>
          It may have moved, or the link may be wrong. The reel and the work are all on the home page.
        </p>
        <div className="sg-actions">
          <Link href="/" className="sg-btn sg-btn-primary">
            Back to the reel
          </Link>
          <a href={`tel:${client.phoneHref}`} className="sg-btn sg-btn-ghost">
            Call {client.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
