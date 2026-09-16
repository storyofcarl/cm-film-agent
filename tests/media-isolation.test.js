/** @jest-environment node */
import { runWithRequest } from '../utils/server/requestContext';
import { objectPath, signedMediaUrl, readStoreBytes } from '../utils/server/mediaStore';
const key = 'a'.repeat(32) + '.png';
test('parallel owners cannot share a request storage prefix', async () => {
  const paths = await Promise.all(['alice', 'bob'].map((id) => runWithRequest({ user: { id } }, async () => {
    await new Promise((resolve) => setTimeout(resolve, id === 'alice' ? 10 : 1));
    return objectPath(key);
  })));
  expect(paths).toEqual(['alice/' + key, 'bob/' + key]);
});
test('media access fails outside an authenticated request or for a traversal key', () => {
  expect(() => objectPath(key)).toThrow('Authenticated request');
  runWithRequest({ user: { id: 'alice' } }, () => expect(() => objectPath('../bob/' + key)).toThrow('Invalid media key'));
});
test('signed delivery and reads always use the current owner and respect storage denials', async () => {
  const sign = jest.fn().mockResolvedValue({ error: new Error('denied') });
  const download = jest.fn().mockResolvedValue({ error: new Error('denied') });
  const supabase = { storage: { from: () => ({ createSignedUrl: sign, download }) } };
  await runWithRequest({ user: { id: 'bob' }, supabase }, async () => {
    await expect(signedMediaUrl(key)).rejects.toThrow('denied');
    await expect(readStoreBytes(key)).rejects.toThrow('denied');
  });
  expect(sign).toHaveBeenCalledWith('bob/' + key, 3600);
  expect(download).toHaveBeenCalledWith('bob/' + key);
});
