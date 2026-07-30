import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The shared event contract is consumed as TypeScript source from the workspace.
  transpilePackages: ["@patient-forms/shared"],
};

export default withNextIntl(nextConfig);
