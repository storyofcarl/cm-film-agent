// Render an approved delivery package locally, without hosted duration limits.
// Usage: node scripts/studio-render.cjs delivery-package.json [output-directory]
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const ffmpeg = require("ffmpeg-static");
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-nostdin", ...args], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let detail = "";
    child.stderr.on("data", (chunk) => {
      detail = (detail + chunk.toString()).slice(-2000);
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code ? reject(new Error(detail.slice(-600))) : resolve(),
    );
  });
const hasAudio = (file) =>
  new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-nostdin", "-hide_banner", "-i", file], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let text = "";
    child.stderr.on("data", (chunk) => {
      text += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", () => resolve(/Audio:/.test(text)));
  });
async function main() {
  const source = process.argv[2];
  if (!source)
    throw new Error("Choose a delivery package JSON exported from Studio.");
  const data = JSON.parse(fs.readFileSync(source, "utf8"));
  const manifest = data.manifest || data;
  if (
    manifest.format !== "film-agent-editorial-v1" ||
    !Array.isArray(manifest.clips)
  )
    throw new Error("Invalid Studio delivery package.");
  const destination = path.resolve(
    process.argv[3] || path.join(path.dirname(source), "studio-delivery"),
  );
  fs.mkdirSync(destination, { recursive: true });
  const output = path.join(destination, "film.mp4");
  if (fs.existsSync(output))
    throw new Error(
      "film.mp4 already exists. Choose a new output directory to preserve the previous delivery.",
    );
  const list = [];
  for (let index = 0; index < manifest.clips.length; index++) {
    const clip = manifest.clips[index];
    if (!/^[\w-]+\.mp4$/.test(clip.sourceFilename))
      throw new Error("Invalid media filename in delivery manifest.");
    const local = path.join(destination, clip.sourceFilename);
    if (!fs.existsSync(local)) {
      if (!/^https:\/\//.test(clip.downloadUrl))
        throw new Error(
          "Export a fresh delivery package with downloadable media links.",
        );
      const response = await fetch(clip.downloadUrl, {
        signal: AbortSignal.timeout(300000),
      });
      if (!response.ok)
        throw new Error(
          "Media download failed. Export fresh links from Studio; existing downloads are retained.",
        );
      const temporary = local + ".part";
      await pipeline(
        Readable.fromWeb(response.body),
        fs.createWriteStream(temporary),
      );
      fs.renameSync(temporary, local);
    }
    const start = Number(clip.in);
    const length = Number(clip.out) - start;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(length) ||
      start < 0 ||
      length <= 0
    )
      throw new Error("Invalid source range.");
    const cut = path.join(destination, `cut-${index}.mp4`);
    if (!fs.existsSync(cut)) {
      const audio = await hasAudio(local);
      const width = Number(manifest.dimensions?.width || 1920);
      const height = Number(manifest.dimensions?.height || 1080);
      if (
        ![width, height].every(
          (value) => Number.isInteger(value) && value >= 64 && value <= 8192,
        )
      )
        throw new Error("Invalid delivery dimensions.");
      const args = ["-ss", String(start), "-t", String(length), "-i", local];
      if (!audio)
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
        audio ? "0:a:0" : "1:a:0",
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        "-r",
        String(manifest.fps || 24),
        "-c:v",
        "libx264",
        "-crf",
        "18",
        "-preset",
        "medium",
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-t",
        String(length),
        "-shortest",
        cut,
      );
      await run(args);
    }
    list.push(`file 'cut-${index}.mp4'`);
    console.log(
      `Prepared ${index + 1}/${manifest.clips.length}: ${clip.title}`,
    );
  }
  const concat = path.join(destination, "edit.txt");
  fs.writeFileSync(concat, list.join("\n"));
  await run([
    "-f",
    "concat",
    "-safe",
    "1",
    "-i",
    concat,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    output,
  ]);
  fs.writeFileSync(
    path.join(destination, "production-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  if (data.otio)
    fs.writeFileSync(
      path.join(destination, "edit.otio"),
      JSON.stringify(data.otio, null, 2),
    );
  console.log("Rendered:", output);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
