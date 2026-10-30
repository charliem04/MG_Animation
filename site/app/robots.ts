import type { MetadataRoute } from "next";
import { client } from "@/client.config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // Everything published here is content. Pages CMS runs on its own
    // domain, so there is nothing on this origin to keep a crawler out of.
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${client.siteUrl}/sitemap.xml`,
  };
}
