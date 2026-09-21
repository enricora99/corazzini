import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // L'area riservata e l'amministrazione non hanno nulla da indicizzare,
      // e comunque a un motore di ricerca risponderebbero con un reindirizzamento.
      disallow: ["/app", "/admin", "/auth", "/api", "/offline"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
