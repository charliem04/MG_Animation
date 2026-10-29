import { ReelHero } from "@/components/signal/ReelHero";
import { Ticker } from "@/components/signal/Ticker";
import { WorkSections } from "@/components/signal/WorkSections";
import { SignalContact } from "@/components/signal/SignalContact";

/**
 * ════════════════════════════════════════════════════════════════════
 *  HOME — the whole Signal one-pager.
 *
 *  Its job: show the showreel big, prove range across logo animation,
 *  documentary and motion graphics, and get people to call or send a
 *  brief. The order is fixed by the design system:
 *
 *    nav → hero (name + meta, then the reel full width) → ticker →
 *    three category sections → contact → footer
 *
 *  Nav and footer live in app/layout.tsx. Everything editable is in
 *  content/work.ts (reel, categories, projects, ticker) and
 *  client.config.ts (name, contact, copy).
 * ════════════════════════════════════════════════════════════════════
 */
export default function Home() {
  return (
    <>
      <ReelHero />
      <Ticker />
      <WorkSections />
      <SignalContact />
    </>
  );
}
