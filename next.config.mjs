/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ← ADD THIS LINE
  },
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai"],
  },
  async headers() {
    return [
      {
        source: "/api/chat",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "undici"];
    }
    return config;
  },
};

export default nextConfig;
