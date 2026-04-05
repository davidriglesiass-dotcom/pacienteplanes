/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: '/',
      destination: '/patient',
      permanent: false,
    },
  ],
};

module.exports = nextConfig;
