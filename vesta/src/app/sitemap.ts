import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookie`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
