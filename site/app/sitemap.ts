import type { MetadataRoute } from "next";
import { client } from "@/client.config";
import { livePaths } from "@/lib/routes";

export const dynamic = "force-static";

/**
 * Generated from the route registry, so the sitemap cannot drift from
 * the pages that exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Every deploy comes from a commit (a code change or a CMS save), so
  // the build date is when the page last changed.
  const lastModified = new Date().toISOString().slice(0, 10);
  return livePaths().map(({ path, priority }) => ({
    url: `${client.siteUrl}${path}`,
    lastModified,
    priority,
    changeFrequency: path === "/" ? "weekly" : "monthly",
  }));
}
