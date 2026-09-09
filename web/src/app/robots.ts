import type { MetadataRoute } from "next";

/** ไม่ให้ search engine เข้าหน้าเครื่องมือของ IC */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/studio-login", "/api/"] },
  };
}
