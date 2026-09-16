import { spawn } from 'node:child_process';

export const runFfmpeg = (bin, args, timeoutMs = 180000) => new Promise((resolve, reject) => {
  const proc = spawn(bin, ['-nostdin', ...args], { windowsHide: true });
  let errorOutput = '';
  const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('Media processing exceeded its time limit. Use a shorter sequence.')); }, timeoutMs);
  proc.stderr.on('data', (chunk) => { errorOutput = (errorOutput + chunk.toString()).slice(-2000); });
  proc.on('error', (error) => { clearTimeout(timer); reject(error); });
  proc.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`Media processing failed (${code}): ${errorOutput.slice(-400)}`)); });
});

export const inspectMedia = (bin, file) => new Promise((resolve, reject) => {
  const proc = spawn(bin, ['-nostdin', '-hide_banner', '-i', file], { windowsHide: true });
  let output = '';
  const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('Could not inspect video')); }, 10000);
  proc.stderr.on('data', (chunk) => { output = (output + chunk.toString()).slice(-64000); });
  proc.on('error', (error) => { clearTimeout(timer); reject(error); });
  proc.on('close', () => {
    clearTimeout(timer);
    const duration = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(output);
    const video = output.split('\n').find((line) => line.includes('Video:')) || '';
    const dimensions = /\b(\d{2,5})x(\d{2,5})\b/.exec(video);
    if (!duration || !dimensions) return reject(new Error('The input is not a supported video'));
    return resolve({ seconds: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]), width: Number(dimensions[1]), height: Number(dimensions[2]), audio: /Audio:/.test(output) });
  });
});
