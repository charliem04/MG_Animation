"use client";

/**
 * The phone-only Menu button. On narrow screens the section links fold
 * into a panel under the bar; this opens and closes it by setting
 * data-menu-open on the header (styles in globals.css).
 *
 * Closes when a link is picked, on Escape, on a tap outside the bar,
 * and when the screen grows past the phone layout. Without JavaScript
 * the links never fold away (the fold only applies under html.js),
 * so the nav still works.
 */
import { useEffect, useState } from "react";

export function NavMenuButton({ controls }: { controls: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".sg-navbar");
    if (!header) return;
    header.toggleAttribute("data-menu-open", open);
    if (!open) return;

    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        header.querySelector<HTMLElement>(".sg-menu-btn")?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!header.contains(e.target as Node)) close();
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(`#${controls} a`)) close();
    };
    const wide = matchMedia("(min-width: 641px)");
    const onWide = () => wide.matches && close();

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    header.addEventListener("click", onClick);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      header.removeEventListener("click", onClick);
      wide.removeEventListener("change", onWide);
    };
  }, [open, controls]);

  return (
    <button
      type="button"
      className="sg-menu-btn"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen((o) => !o)}
    >
      <span className="sg-menu-icon" aria-hidden="true">
        <span />
        <span />
      </span>
    </button>
  );
}
