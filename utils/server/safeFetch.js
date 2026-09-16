import dns from 'node:dns';
import { Agent, fetch as httpFetch } from 'undici';
import ipaddr from 'ipaddr.js';

export const isPublicAddress = (address) => {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
};
const dispatcher = new Agent({ connect: { lookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      return callback(new Error('Private network destinations are not allowed'));
    }
    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
} } });

export const safeFetch = async (input, options = {}, redirects = 0) => {
  const url = new URL(input);
  if (url.protocol === 'data:') return globalThis.fetch(input, options);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid remote URL');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (ipaddr.isValid(host) && !isPublicAddress(host)) throw new Error('Private network destinations are not allowed');
  const response = await httpFetch(url, { ...options, dispatcher, redirect: 'manual', signal: options.signal || AbortSignal.timeout(120000) });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const next = response.headers.get('location');
    await response.body?.cancel();
    if (!next || redirects >= 4) throw new Error('Too many media redirects');
    // Provider requests carrying credentials must never follow redirects.
    const headers = new Headers(options.headers);
    if (headers.has('authorization') || headers.has('x-api-key')) throw new Error('Authenticated redirects are not allowed');
    return safeFetch(new URL(next, url).href, options, redirects + 1);
  }
  return response;
};
