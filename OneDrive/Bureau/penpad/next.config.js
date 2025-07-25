/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side configuration
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Better handling of Firebase modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/auth': require.resolve('firebase/auth'),
      'firebase/firestore': require.resolve('firebase/firestore'),
      'firebase/storage': require.resolve('firebase/storage'),
      'firebase/app': require.resolve('firebase/app'),
    };

    return config;
  },
}

module.exports = nextConfig 