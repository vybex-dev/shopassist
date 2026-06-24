/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai"],
  },

  // Required so Vercel streams SSE without buffering
  // (already set via vercel.json headers, this is a belt-and-suspenders addition)
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

  // Silence the Supabase undici warnings in Vercel build logs
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "undici"];
    }
    return config;
  },
};

export default nextConfig;
