// Attach automation access only to the deployment being tested, never Storage or providers.
module.exports = (base) => async (url, options = {}) => {
  const headers = new Headers(options.headers);
  if (new URL(url).origin === new URL(base).origin && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers.set('x-vercel-protection-bypass', process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  }
  return globalThis.fetch(url, { ...options, headers, redirect: options.redirect || 'manual' });
};
