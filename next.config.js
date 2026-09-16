/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { cpus: 2 },
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/seed': ['./node_modules/ffmpeg-static/ffmpeg*'],
    '/api/film/*': ['./node_modules/ffmpeg-static/ffmpeg*'],
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
