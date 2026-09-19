import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkout", "/api/"],
    },
    sitemap: "https://myeyes.pk/sitemap.xml",
  };
}
