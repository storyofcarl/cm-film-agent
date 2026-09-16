/** @jest-environment node */
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/asset-upload';
import { checkInUrl } from '../utils/server/mediaStore';
import { catalogueMedia } from '../utils/server/catalogueMedia';
import { callAssetApi } from '../utils/server/assetApi';

jest.mock('../utils/server/withAuth', () => ({ withAuth: (fn) => fn }));
jest.mock('../utils/server/mediaStore', () => ({ checkInUrl: jest.fn(), TYPE_BY_EXT: { png: 'image/png', mp4: 'video/mp4' } }));
jest.mock('../utils/server/catalogueMedia', () => ({ catalogueMedia: jest.fn() }));
jest.mock('../utils/server/assetApi', () => ({ callAssetApi: jest.fn() }));
const key = 'a'.repeat(32) + '.png';
const url = '/api/film/media?key=' + key;
beforeEach(() => {
  jest.clearAllMocks();
  checkInUrl.mockResolvedValue({ key, url });
  catalogueMedia.mockResolvedValue('asset-owned');
  callAssetApi.mockResolvedValue({ Result: { Status: 'Active', URL: 'https://provider.example/expiring-url' } });
});
test('asset tool records provider ownership and returns a durable media reference', async () => {
  const { req, res } = createMocks({ method: 'POST', body: { imageUrl: url, assetName: 'Plate' } });
  await handler(req, res);
  expect(res.statusCode).toBe(200);
  expect(catalogueMedia).toHaveBeenCalledWith(key, 'Plate');
  expect(res._getJSONData()).toMatchObject({ assetId: 'asset-owned', asset: { URL: url, Status: 'Active' } });
});
test('a denied private reference is never registered with the provider', async () => {
  checkInUrl.mockRejectedValue(new Error('Media not found'));
  const { req, res } = createMocks({ method: 'POST', body: { imageUrl: url } });
  await expect(handler(req, res)).rejects.toThrow('Media not found');
  expect(catalogueMedia).not.toHaveBeenCalled();
  expect(callAssetApi).not.toHaveBeenCalled();
});
test('a registration outage returns the saved media reference for a retry', async () => {
  catalogueMedia.mockResolvedValue(null);
  const { req, res } = createMocks({ method: 'POST', body: { imageUrl: url } });
  await handler(req, res);
  expect(res.statusCode).toBe(503);
  expect(res._getJSONData().mediaUrl).toBe(url);
});
