import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { storeKeyFromUrl, readStoreBytes, checkInUrl, checkInBytes } from '../../server/mediaStore';
import { runFfmpeg, inspectMedia } from '../../server/ffmpeg';

export const stitchShots = async ({ shots }) => {
  if (!Array.isArray(shots) || !shots.length || shots.length > 20) throw new Error('Choose between 1 and 20 shots for a preview export.');
  const ffmpeg = (await import('ffmpeg-static')).default;
  if (!ffmpeg) throw new Error('Video processing is unavailable.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'film-stitch-'));
  const started = Date.now();
  try {
    const files = []; let size = 0; let seconds = 0; let outputSize;
    for (let i = 0; i < shots.length; i += 1) {
      const key = storeKeyFromUrl(shots[i]) || (await checkInUrl(shots[i])).key;
      const { buffer } = await readStoreBytes(key);
      size += buffer.length;
      if (size > 200 * 1024 * 1024) throw new Error('Preview exports support up to 200 MB of source media. Export a shorter sequence.');
      const file = path.join(dir, 'shot-' + i + '.mp4');
      fs.writeFileSync(file, buffer);
      const info = await inspectMedia(ffmpeg, file);
      seconds += info.seconds;
      if (seconds > 180) throw new Error('Preview exports support up to three minutes. Export a shorter sequence.');
      if (!outputSize) {
        const scale = Math.min(1, 1920 / Math.max(info.width, info.height), 1080 / Math.min(info.width, info.height));
        outputSize = [Math.max(2, Math.round(info.width * scale / 2) * 2), Math.max(2, Math.round(info.height * scale / 2) * 2)];
      }
      const [width, height] = outputSize;
      const normalized = path.join(dir, 'normalized-' + i + '.mp4');
      const remaining = 220000 - (Date.now() - started);
      if (remaining < 10000) throw new Error('This sequence exceeds the preview rendering time limit. Export fewer shots.');
      await runFfmpeg(ffmpeg, ['-y', '-i', file, ...(!info.audio ? ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'] : []),
        '-map', '0:v:0', '-map', info.audio ? '0:a:0' : '1:a:0', '-t', String(info.seconds),
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        '-r', '30', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-ar', '48000', '-ac', '2', normalized], remaining);
      files.push(normalized);
    }
    const list = path.join(dir, 'list.txt');
    fs.writeFileSync(list, files.map((file) => "file '" + file.replaceAll('\\', '/') + "'").join('\n'));
    const output = path.join(dir, 'final.mp4');
    const remaining = 240000 - (Date.now() - started);
    if (remaining < 10000) throw new Error('Source download took too long. Try a shorter sequence.');
    await runFfmpeg(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', list,
      '-c', 'copy', '-movflags', '+faststart', output], remaining);
    const buffer = fs.readFileSync(output);
    const stored = await checkInBytes(buffer, 'video/mp4');
    return { url: stored.url, stableUrl: stored.url, assetId: null, shots: shots.length, size: buffer.length };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};
