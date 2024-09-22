// @ts-ignore
import { withGlobalCss } from "next-global-css";

await import("./src/env.mjs");

const withConfig = withGlobalCss();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          process: "undefined",
        }),
      );
    }
    return config;
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};
// export default withConfig(nextConfig);

export default nextConfig;
