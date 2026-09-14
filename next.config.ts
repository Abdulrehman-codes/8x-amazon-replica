import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next emits a full srcset per image. The defaults give eight device
    // widths and eight image widths, which on a page of ~75 product tiles put
    // over a thousand long URLs into the markup — a large share of its weight.
    // These cover the real breakpoints and the fixed tile sizes actually used.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
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
