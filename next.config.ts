import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Room photos uploaded by the admin are hosted on Cloudinary.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    serverActions: {
      // The room form uploads several photos in one request.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
