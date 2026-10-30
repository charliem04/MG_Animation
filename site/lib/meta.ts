import type { Metadata } from "next";

/**
 * The robots directive for a page that states its own index policy:
 * the legal pages. noindex, follow keeps a legal page out of search
 * results while the links out of it still count.
 */
export function robotsFor(index: boolean): NonNullable<Metadata["robots"]> {
  return { index, follow: true };
}
