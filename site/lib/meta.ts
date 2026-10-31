import type { Metadata } from "next";
import { client } from "@/client.config";

/**
 * The robots directive for a page that states its own index policy:
 * the legal pages. noindex, follow keeps a legal page out of search
 * results while the links out of it still count.
 */
export function robotsFor(index: boolean): NonNullable<Metadata["robots"]> {
  return { index, follow: true };
}

/**
 * Metadata for a page other than home: its own title, description,
 * canonical and share link. Without this a page inherits the home
 * page's canonical and og:url, which tells search engines it is a copy
 * of the home page.
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  index: boolean;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    robots: robotsFor(opts.index),
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.path,
      siteName: client.businessName,
      images: [{ url: client.ogImagePath, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [client.ogImagePath],
    },
  };
}
