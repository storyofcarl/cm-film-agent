import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runFfmpeg, inspectMedia } from "../../../../utils/server/ffmpeg";
import {
  checkInBytes,
  checkInUrl,
  readStoreBytes,
} from "../../../../utils/server/mediaStore";
import { fault } from "./errors";

const binary = async () => (await import("ffmpeg-static")).default;
async function localSource(directory, url, name) {
  const stored = await checkInUrl(url);
  const { buffer } = await readStoreBytes(stored.key);
  const file = path.join(directory, name + "." + stored.key.split(".").pop());
  fs.writeFileSync(file, buffer);
  return file;
}
export async function inspectStoredMedia(media) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "studio-inspect-"));
  try {
    const input = await localSource(directory, media.url, "source");
    const ffmpeg = await binary();
    if (media.type === "video") {
      const info = await inspectMedia(ffmpeg, input);
      const start = Number(media.in || 0);
      const end = Number(media.out ?? info.seconds);
      if (start < 0 || end <= start || end > info.seconds + 0.05)
        throw fault("The supplied trim is outside the measured video.");
      return {
        ...media,
        in: start,
        out: end,
        duration: end - start,
        sourceDuration: info.seconds,
        width: info.width,
        height: info.height,
        hasAudio: info.audio,
      };
    }
    // Decode at least a frame/sample rather than trusting an uploaded MIME label.
    await runFfmpeg(
      ffmpeg,
      [
        "-i",
        input,
        ...(media.type === "image" ? ["-frames:v", "1"] : ["-t", "1"]),
        "-f",
        "null",
        "-",
      ],
      20000,
    );
    return media;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
export async function extractFrame(media, timestamp = 0) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "studio-frame-"));
  try {
    const input = await localSource(directory, media.url, "input");
    const output = path.join(directory, "frame.png");
    const ffmpeg = await binary();
    const info = await inspectMedia(ffmpeg, input);
    if (timestamp < 0 || timestamp >= info.seconds)
      throw fault("The requested frame is outside the source clip.");
    await runFfmpeg(ffmpeg, [
      "-ss",
      String(timestamp),
      "-i",
      input,
      "-frames:v",
      "1",
      "-vf",
      "scale=1920:-2",
      output,
    ]);
    return {
      ...(await checkInBytes(fs.readFileSync(output), "image/png")),
      type: "image",
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
export async function assembleClips(
  clips,
  { width = null, height = null, fps = 24 } = {},
) {
  if (!clips.length) throw fault("Choose completed shot clips for assembly.");
  // This adapter is also usable by a local worker, outside the hosted request
  // window, for feature-length delivery. It preserves exact per-shot trims.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "studio-assembly-"));
  try {
    const ffmpeg = await binary();
    const normalized = [];
    for (let index = 0; index < clips.length; index++) {
      const clip = clips[index];
      const input = await localSource(directory, clip.url, `source-${index}`);
      const info = await inspectMedia(ffmpeg, input);
      width ||= Math.floor(info.width / 2) * 2;
      height ||= Math.floor(info.height / 2) * 2;
      const start = Number(clip.in || 0);
      const end = Number(clip.out ?? info.seconds);
      if (start < 0 || end <= start || end > info.seconds + 0.2)
        throw fault("A shot trim lies outside its source footage.");
      const output = path.join(directory, `clip-${index}.mp4`);
      const args = [
        "-ss",
        String(start),
        "-t",
        String(end - start),
        "-i",
        input,
      ];
      if (!info.audio)
        args.push(
          "-f",
          "lavfi",
          "-i",
          "anullsrc=channel_layout=stereo:sample_rate=48000",
        );
      args.push(
        "-map",
        "0:v:0",
        "-map",
        info.audio ? "0:a:0" : "1:a:0",
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        "-r",
        String(fps),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-t",
        String(end - start),
        "-shortest",
        output,
      );
      await runFfmpeg(ffmpeg, args, 240000);
      normalized.push(`file 'clip-${index}.mp4'`);
    }
    const list = path.join(directory, "clips.txt");
    fs.writeFileSync(list, normalized.join("\n"));
    const output = path.join(directory, "assembled.mp4");
    await runFfmpeg(
      ffmpeg,
      [
        "-f",
        "concat",
        "-safe",
        "1",
        "-i",
        list,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        output,
      ],
      240000,
    );
    const inspected = await inspectMedia(ffmpeg, output);
    return {
      ...(await checkInBytes(fs.readFileSync(output), "video/mp4")),
      type: "video",
      duration: inspected.seconds,
      width: inspected.width,
      height: inspected.height,
      clips,
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
