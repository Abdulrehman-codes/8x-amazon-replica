import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Book jackets. Open Library 302s these through the Internet Archive,
      // which serves them from numbered ia*.us.archive.org hosts.
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "*.us.archive.org" },
    ],
  },
};

export default nextConfig;
