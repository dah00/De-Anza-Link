import os from "node:os";
import type { NextConfig } from "next";

/** LAN IPs so a phone on the same Wi-Fi can load `/_next` and run server actions. */
function lanHosts(): string[] {
  return Object.values(os.networkInterfaces())
    .flatMap((ifaces) => ifaces ?? [])
    .filter((iface) => {
      const family = String(iface.family);
      return !iface.internal && (family === "IPv4" || family === "4");
    })
    .map((iface) => iface.address);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanHosts(),
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      { source: "/navigator", destination: "/resources", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
