import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        port: "",
        pathname: "/ipfs/**",
      },
      { 
        protocol: "https", 
        hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
