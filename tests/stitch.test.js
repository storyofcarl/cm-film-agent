/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import { runFfmpeg, inspectMedia } from '../utils/server/ffmpeg';
import { stitchShots } from '../utils/film/server/stitch';
import { readStoreBytes, checkInBytes } from '../utils/server/mediaStore';

jest.mock('../utils/server/mediaStore', () => ({
  storeKeyFromUrl: (value) => value,
  readStoreBytes: jest.fn(), checkInBytes: jest.fn(), checkInUrl: jest.fn(),
}));

test('export preserves a silent shot followed by an audio shot with different dimensions and frame rate', async () => {
  const root = path.resolve('.local'); fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, 'render-test-'));
  try {
    const silent = path.join(dir, 'silent.mp4'); const audio = path.join(dir, 'audio.mp4');
    await runFfmpeg(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=24:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', silent]);
    await runFfmpeg(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'color=c=green:s=240x320:r=25:d=1', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', '-shortest', audio]);
    readStoreBytes.mockImplementation(async (key) => ({ buffer: fs.readFileSync(key === 'silent' ? silent : audio) }));
    const output = path.join(dir, 'output.mp4');
    checkInBytes.mockImplementation(async (bytes) => { fs.writeFileSync(output, bytes); return { url: '/api/film/media?key=test' }; });
    const result = await stitchShots({ shots: ['silent', 'audio'] });
    const info = await inspectMedia(ffmpeg, output);
    expect(result.shots).toBe(2);
    expect(info.width).toBe(320); expect(info.height).toBe(180);
    expect(info.audio).toBe(true);
    expect(info.seconds).toBeGreaterThanOrEqual(2); expect(info.seconds).toBeLessThan(2.2);
    expect(checkInBytes).toHaveBeenCalledWith(expect.any(Buffer), 'video/mp4');
  } finally {
    if (!path.resolve(dir).startsWith(root + path.sep)) throw new Error('Unsafe temporary directory');
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
