"use client";

/**
 * A looping carousel for a section with four or more videos.
 *
 * Cards stay the same size as the three-up rail. The arrows move one
 * card at a time and wrap around forever; the dots under it show which
 * video is first in view and jump straight to one when clicked. Swipe
 * works on touch screens, and the arrow keys work when the carousel
 * has focus.
 *
 * How the loop works: the list is drawn three times in a row and the
 * view starts on the middle copy. Stepping past either end animates
 * into a neighbouring copy, then snaps back to the same card in the
 * middle copy with no animation, so the jump can't be seen. Only the
 * middle copy is reachable by keyboard or screen reader.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  label: string;
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  render: (item: T) => ReactNode;
};

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
      {dir === "prev" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

export function WorkCarousel<T>({ items, label, itemKey, itemLabel, render }: Props<T>) {
  const n = items.length;
  // Position on the tripled track. n…2n-1 is the middle (real) copy.
  const [index, setIndex] = useState(n);
  // True for the one render where the track moves with no slide.
  const [jump, setJump] = useState(false);
  const track = useRef<HTMLUListElement>(null);
  const reduced = useRef(false);
  const swipeX = useRef<number | null>(null);
  // A step queued behind a snap (see go).
  const pending = useRef<number | null>(null);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const wrap = useCallback((i: number) => n + ((((i - n) % n) + n) % n), [n]);
  const inMiddle = index >= n && index < 2 * n;

  const go = useCallback(
    (to: number) => {
      // With reduced motion there is no slide, so land in the middle copy directly.
      if (reduced.current) {
        setIndex(wrap(to));
        return;
      }
      // Fast clicks can ask for a card past the side copies. Snap to the
      // same card in the middle copy first, then slide from there.
      if (to < n - 1 || to > 2 * n) {
        pending.current = wrap(index) + (to - index);
        setJump(true);
        setIndex(wrap(index));
        return;
      }
      setIndex(to);
    },
    [index, n, wrap]
  );

  // After a slide ends in a side copy, snap back to the middle copy unseen.
  const settle = useCallback(() => {
    setIndex((i) => {
      if (i >= n && i < 2 * n) return i;
      setJump(true);
      return wrap(i);
    });
  }, [n, wrap]);

  // transitionend does the snap; this timer is the backup for when it
  // never arrives (a background tab, an interrupted slide).
  useEffect(() => {
    if (jump || inMiddle) return;
    const t = track.current;
    const d = t ? getComputedStyle(t).transitionDuration : "0s";
    const ms = parseFloat(d) * (d.endsWith("ms") ? 1 : 1000);
    const id = setTimeout(settle, ms + 120);
    return () => clearTimeout(id);
  }, [index, jump, inMiddle, settle]);

  // A snap renders once with the slide switched off. Reading the
  // track's size makes the browser apply that position right away, so
  // switching the slide back on doesn't animate it. Then run any queued step.
  useLayoutEffect(() => {
    if (!jump) return;
    void track.current?.offsetWidth;
    setJump(false);
    if (pending.current !== null) {
      setIndex(pending.current);
      pending.current = null;
    }
  }, [jump]);

  const current = (((index - n) % n) + n) % n;
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  // Tabbing onto a card that's out of view brings it to the front.
  const onFocusItem = (k: number) => {
    if (current !== k) go(n + k);
  };

  const tripled = [0, 1, 2].flatMap((copy) => items.map((item, k) => ({ item, k, copy })));

  return (
    <div
      className="sg-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKey}
    >
      <div
        className="sg-carousel-view"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipeX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeX.current === null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        }}
        onPointerCancel={() => {
          swipeX.current = null;
        }}
      >
        <ul
          ref={track}
          className="sg-carousel-track"
          style={{ "--i": index } as CSSProperties}
          data-jump={jump || undefined}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === "transform") settle();
          }}
        >
          {tripled.map(({ item, k, copy }) => {
            const hidden = copy !== 1;
            return (
              <li
                key={`${copy}-${itemKey(item)}`}
                aria-hidden={hidden || undefined}
                // inert keeps the copies out of the tab order and screen readers.
                // React 18 only writes it as a string (inert=""), hence the cast.
                inert={hidden ? ("" as unknown as boolean) : undefined}
                aria-roledescription="slide"
                aria-label={hidden ? undefined : `${k + 1} of ${n}: ${itemLabel(item)}`}
                onFocus={hidden ? undefined : () => onFocusItem(k)}
              >
                {render(item)}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sg-carousel-edge is-prev">
        <button type="button" className="sg-arrow" onClick={prev} aria-label={`Previous ${label} video`}>
          <Arrow dir="prev" />
        </button>
      </div>
      <div className="sg-carousel-edge is-next">
        <button type="button" className="sg-arrow" onClick={next} aria-label={`Next ${label} video`}>
          <Arrow dir="next" />
        </button>
      </div>

      <div className="sg-dots">
        {items.map((item, k) => (
          <button
            key={itemKey(item)}
            type="button"
            className="sg-dot"
            aria-label={`Show ${itemLabel(item)}`}
            aria-current={k === current ? "true" : undefined}
            onClick={() => {
              // Take the short way round, so 4 → 1 is one step, not three back.
              let d = k - current;
              if (d > n / 2) d -= n;
              if (d < -n / 2) d += n;
              go(index + d);
            }}
          />
        ))}
      </div>
    </div>
  );
}
