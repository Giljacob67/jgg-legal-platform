import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});

