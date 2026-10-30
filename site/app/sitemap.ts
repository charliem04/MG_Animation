import type { MetadataRoute } from "next";
import { client } from "@/client.config";
import { livePaths } from "@/lib/routes";

export const dynamic = "force-static";

/**
 * Generated from the route registry, so the sitemap cannot drift from
 * the pages that exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return livePaths().map(({ path, priority }) => ({
    url: `${client.siteUrl}${path}`,
    priority,
    changeFrequency: path === "/" ? "weekly" : "monthly",
  }));
}
