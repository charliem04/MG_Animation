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
 * Starts the power-on before the first frame is drawn. It runs in
 * <head>, ahead of the page, so the browser's very first paint is
 * already the 1px line; started from React instead, the finished page
 * flashes up first and then snaps to the line.
 *
 * The animation is then held on that line (paused) until the page has
 * finished loading, and only let go on the frame after. Phones spend
 * the first second or so after their first paint running the site's
 * code; an animation started in that window has its clock running but
 * nothing drawn, so the visitor only ever saw the end. Waiting for the
 * load means it plays on an idle phone. A 3.5s cap lets it go anyway,
 * and 3s after it starts the class comes off whatever happened, so
 * nothing stays hidden.
 *
 * Nothing starts until the page is actually on screen: phone browsers
 * load the top address-bar suggestion in the background while you
 * type, and a background tab is the same. "Seen" is only recorded once
 * it really plays.
 *
 * --boot-y is the scroll position when it starts, so the line opens in
 * the middle of what's on screen even when the page loads scrolled down.
 *
 * Plays once per visit and never under reduced motion. Removing the
 * class when the animation ends puts #sg-screen back to normal (an
 * element with a transform animation traps position: fixed children).
 * If this script doesn't run, nothing is hidden: the page just shows.
 *
 * ?bootdebug on any URL plays it every time and prints a timing log in
 * the corner (ms since the page started), for checking on a real phone.
 *
 * It also marks <html> with "js", which the phone menu uses to fold the
 * nav links away only when the Menu button can open them again.
 */
const POWER_ON = `(function(){
var d=document.documentElement,seen=false,started=false,armed=false,box=null,L=[];
var dbg=/[?&]bootdebug/.test(location.search);
function log(m){if(!dbg)return;L.push(Math.round(performance.now())+" "+m);if(box)box.textContent=L.join("\\n")}
if(dbg){document.addEventListener("DOMContentLoaded",function(){box=document.createElement("pre");box.style.cssText="position:fixed;left:8px;bottom:8px;z-index:2147483647;margin:0;padding:8px 10px;background:rgba(0,0,0,.88);color:#9f9;font:11px/1.35 monospace;pointer-events:none;max-width:90vw;white-space:pre-wrap";document.body.appendChild(box);log("box")});
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){log(e.name+" @"+Math.round(e.startTime))})}).observe({type:"paint",buffered:true})}catch(e){}
document.addEventListener("animationstart",function(e){if(e.animationName==="sg-power")log("animationstart")});}
d.classList.add("js");
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
try{seen=!!sessionStorage.getItem("sg-powered")}catch(e){}
log("script vis="+document.visibilityState+" prerender="+!!document.prerendering+" seen="+seen+" reduce="+reduce+" w="+innerWidth);
if(!dbg&&(seen||reduce))return;
d.classList.add("sg-boot");
function end(why){if(!d.classList.contains("sg-boot"))return;d.classList.remove("sg-boot","sg-on");d.style.removeProperty("--boot-y");log("end "+why)}
function go(why){if(started)return;started=true;try{sessionStorage.setItem("sg-powered","1")}catch(e){}d.style.setProperty("--boot-y",(window.scrollY||0)+"px");d.classList.add("sg-on");log("go "+why);setTimeout(function(){end("timer")},3000)}
document.addEventListener("animationend",function f(e){if(e.animationName!=="sg-power")return;document.removeEventListener("animationend",f);end("animationend")});
function next(){requestAnimationFrame(function(){setTimeout(function(){go("loaded")},0)})}
function arm(){if(armed)return;armed=true;log("on screen");if(document.readyState==="complete")next();else addEventListener("load",function(){log("load");next()});setTimeout(function(){go("cap")},3500)}
function onScreen(){return !document.prerendering&&document.visibilityState==="visible"}
function check(){if(onScreen())arm()}
check();
document.addEventListener("visibilitychange",check);
document.addEventListener("prerenderingchange",check);
})();`;

/**
 * The chrome lives here, not on the home page — every route gets the
 * same Signal nav and footer, and a new page cannot ship without them.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: POWER_ON adds a class to <html> before
    // React loads, which React would otherwise report as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: POWER_ON }} />
      </head>
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
        {/* #sg-screen is what powers on once per visit (POWER_ON above). */}
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
