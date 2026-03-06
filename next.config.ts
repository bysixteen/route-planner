import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGhPages && {
    output: "export",
    basePath: "/route-planner",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
