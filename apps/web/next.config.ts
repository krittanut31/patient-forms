import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared event contract is consumed as TypeScript source from the workspace.
  transpilePackages: ["@patient-forms/shared"],
};

export default nextConfig;
