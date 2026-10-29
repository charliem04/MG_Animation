import { ticker } from "@/content/work";

/**
 * Full-bleed marquee of specialties, directly below the reel. The list
 * is rendered twice so the -50% loop is seamless; the ✦ separators are
 * the only glyph decoration Signal allows.
 */
export function Ticker() {
  const words = [...ticker, ...ticker, ...ticker, ...ticker];
  return (
    <div className="sg-ticker" aria-hidden="true">
      <div className="sg-ticker-track">
        {words.flatMap((w, i) => [
          <span key={`w${i}`}>{w}</span>,
          <span key={`s${i}`} className="sg-sep">
            ✦
          </span>,
        ])}
      </div>
    </div>
  );
}
