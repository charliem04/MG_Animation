import type { Metadata } from "next";
/*
 * Signal's three faces, self-hosted via Fontsource so font-src stays
 * 'self' in scripts/csp.mjs. Only the weights the design uses.
 * Swap these AND the --font-* stacks in app/globals.css together;
 * scripts/fonts.mjs preloads Unbounded 800 (the hero name).
 */
import "@fontsource/unbounded/latin-500.css";
import "@fontsource/unbounded/latin-800.css";
import "@fontsource/instrument-sans/latin-400.css";
import "@fontsource/instrument-sans/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "./globals.css";
import { client } from "@/client.config";
import { IS_PREVIEW } from "@/lib/preview";
import { JsonLd } from "@/components/JsonLd";
import { PreviewBanner } from "@/components/PreviewBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@/components/Analytics";
import { InteractionTracking } from "@/components/InteractionTracking";
import { SmoothScroll } from "@/components/SmoothScroll";
import { PageTransition } from "@/components/PageTransition";
import { SiteNav, SiteFooter, SplitFilters } from "@/components/signal/SiteChrome";
import { SignalMotion } from "@/components/signal/SignalMotion";

// Site-level metadata. Individual pages override title/description via
// their own `metadata` export, built from lib/meta.ts.
export const metadata: Metadata = {
  metadataBase: new URL(client.siteUrl),
  // Belt and braces with the per-page noindex in lib/meta.ts, the
  // preview robots.txt and the X-Robots-Tag header: a replica of a real
  // business competing with that business in search is the expensive
  // failure, and each of these can be missed on its own.
  ...(IS_PREVIEW ? { robots: { index: false, follow: false } } : {}),
  title: client.metaTitle,
  description: client.metaDescription,
  alternates: { canonical: client.siteUrl },
  openGraph: {
    title: client.metaTitle,
    description: client.metaDescription,
    url: client.siteUrl,
    siteName: client.businessName,
    images: [{ url: client.ogImagePath, width: 1200, height: 630 }],
    type: "website",
  },
};

/**
 * The chrome lives here, not on the home page — every route gets the
 * same Signal nav and footer, and a new page cannot ship without them.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/*
          Framer serializes an animation's starting state into the HTML,
          so every element waiting to be revealed ships as
          `style="opacity:0"` — 36 of them on the home page alone. With
          JavaScript running that is invisible for a few hundred
          milliseconds and then correct. With JavaScript off or failed,
          it is a permanently blank page on a site whose entire job is
          to be found and phoned.

          Crawlers execute JavaScript and are not the reason this is
          here. The reason is the visitor on hotel wifi whose bundle
          request times out, who currently sees nothing at all and has
          no way to know there was ever anything to see.

          This is deliberately a blunt attribute selector rather than a
          class the primitives opt into: the point is to catch every
          animated element, including any added later by someone who
          never reads this file.
        */}
        <noscript>
          {/*
            dangerouslySetInnerHTML, not a string child. <style> is a
            raw-text element: React would escape the selector's quotes
            to &quot;, and the CSS parser does not decode entities, so
            the rule silently never matches. The content is a literal
            in this file with nothing interpolated into it.

            style-src allows 'unsafe-inline' (scripts/csp.mjs:114), so
            this is not blocked when JavaScript is off.
          */}
          <style
            dangerouslySetInnerHTML={{
              __html: `[style*="opacity:0"]{opacity:1!important;transform:none!important}[data-mask-line]{transform:none!important}`,
            }}
          />
        </noscript>
        {/* Renders nothing; owns the wheel-momentum scrolling for every
            route. Mounted first so it is running before anything below
            can be scrolled to. */}
        <SmoothScroll />
        {/* Renders nothing until the first client-side navigation. */}
        <PageTransition />
        <PreviewBanner />
        <SplitFilters />
        {/* #sg-screen is what powers on once per visit (SignalMotion). */}
        <div id="sg-screen">
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </div>
        <SignalMotion />
        <CookieConsent />
        <Analytics />
        <InteractionTracking />
        <JsonLd />
      </body>
    </html>
  );
}
