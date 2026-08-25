import path from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

import type { NextConfig } from "next";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const localNetworkOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((address) => address?.family === "IPv4" && !address.internal)
  .map((address) => address!.address);

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(currentDirectory, ".."),
  allowedDevOrigins: ["localhost", "127.0.0.1", ...localNetworkOrigins],
};

export default nextConfig;
