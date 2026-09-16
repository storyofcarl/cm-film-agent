/** @jest-environment node */
import { isPublicAddress, safeFetch } from '../utils/server/safeFetch';
test.each(['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.0.2', '172.16.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1'])('blocks private address %s', (address) => {
  expect(isPublicAddress(address)).toBe(false);
});
test('allows public addresses', () => { expect(isPublicAddress('8.8.8.8')).toBe(true); });
test('rejects local schemes and credential-bearing URLs before any request', async () => {
  for (const url of ['file:///etc/passwd', 'http://127.0.0.1/', 'http://[::1]/', 'https://user:secret@example.com/']) {
    await expect(safeFetch(url)).rejects.toThrow();
  }
});
