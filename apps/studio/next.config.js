const path = require('node:path');
const root = path.resolve(__dirname, '../..');
module.exports = {
  experimental: { cpus: 2, externalDir: true },
  outputFileTracingRoot: root,
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: { '/api/**': ['../../node_modules/ffmpeg-static/ffmpeg*', './resources/skills/**/*'] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
