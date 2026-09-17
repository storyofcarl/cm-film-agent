/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import { runFfmpeg, inspectMedia } from "../utils/server/ffmpeg";
import { assembleClips, extractFrame } from "../apps/studio/lib/server/media";
import {
  readStoreBytes,
  checkInBytes,
  checkInUrl,
} from "../utils/server/mediaStore";
import { createProject, applyCommand } from "../apps/studio/lib/domain";
import {
  deliveryTimeline,
  editorialManifest,
  otioTimeline,
} from "../apps/studio/lib/delivery";
jest.mock("../utils/server/mediaStore", () => ({
  readStoreBytes: jest.fn(),
  checkInBytes: jest.fn(),
  checkInUrl: jest.fn(),
}));

test("shot assembly trims neighboring footage, preserves source resolution and handles mixed audio", async () => {
  const root = path.resolve(".local");
  fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, "studio-media-"));
  try {
    const silent = path.join(dir, "silent.mp4");
    const audio = path.join(dir, "audio.mp4");
    await runFfmpeg(ffmpeg, [
      "-f",
      "lavfi",
      "-i",
      "color=c=red:s=640x360:r=24:d=4",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      silent,
    ]);
    await runFfmpeg(ffmpeg, [
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=240x320:r=25:d=3",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=3",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      audio,
    ]);
    checkInUrl.mockImplementation(async (url) => ({
      key: url.includes("silent") ? "silent.mp4" : "audio.mp4",
    }));
    readStoreBytes.mockImplementation(async (key) => ({
      buffer: fs.readFileSync(key === "silent.mp4" ? silent : audio),
    }));
    const rendered = path.join(dir, "assembled.mp4");
    checkInBytes.mockImplementation(async (bytes, type) => {
      if (type === "video/mp4") fs.writeFileSync(rendered, bytes);
      return {
        url:
          "https://example.com/result." +
          (type === "video/mp4" ? "mp4" : "png"),
      };
    });
    const result = await assembleClips([
      { url: "https://example.com/silent", in: 1, out: 2 },
      { url: "https://example.com/audio", in: 1, out: 2.5 },
    ]);
    const info = await inspectMedia(ffmpeg, rendered);
    expect(info.width).toBe(640);
    expect(info.height).toBe(360);
    expect(info.audio).toBe(true);
    expect(info.seconds).toBeGreaterThanOrEqual(2.5);
    expect(info.seconds).toBeLessThan(2.7);
    expect(result.clips.map((clip) => clip.in)).toEqual([1, 1]);
    await expect(
      extractFrame({ url: "https://example.com/silent" }, 9),
    ).rejects.toThrow("outside");
    await expect(
      extractFrame({ url: "https://example.com/silent" }, 1.5),
    ).resolves.toMatchObject({ type: "image" });
    await expect(
      assembleClips([{ url: "https://example.com/silent", in: 0, out: 20 }]),
    ).rejects.toThrow("outside");
  } finally {
    if (!dir.startsWith(root + path.sep))
      throw new Error("Unsafe temporary path");
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, 30000);

test("official OTIO parser reads the exported ranges and local renderer preserves silent+audio footage", async () => {
  const root = path.resolve(".local");
  const dir = fs.mkdtempSync(path.join(root, "studio-delivery-"));
  try {
    let project = createProject({ title: "Synthetic delivery" });
    const sceneId = project.nodes.find((node) => node.type === "scene").id;
    for (let index = 0; index < 2; index++) {
      project = applyCommand(project, {
        type: "item.add",
        payload: {
          kind: "shot",
          sceneId,
          title: `Fixture ${index}`,
          prompt: "Synthetic color.",
          duration: 1,
        },
      });
      const shot = project.shots.at(-1);
      project = applyCommand(project, {
        type: "version.add",
        payload: {
          itemId: shot.id,
          media: {
            url: "https://example.com/source.mp4",
            type: "video",
            in: 1,
            out: 2,
          },
        },
      });
      project = applyCommand(project, {
        type: "version.review",
        payload: {
          itemId: shot.id,
          versionId: project.shots.at(-1).selectedVersionId,
          review: "approved",
        },
      });
    }
    expect(() => deliveryTimeline(project)).toThrow("Approve");
    project = applyCommand(project, {
      type: "scene.approve",
      payload: { sceneId },
    });
    const timeline = deliveryTimeline(project);
    const manifest = editorialManifest(project, timeline);
    const otio = otioTimeline(timeline);
    // Keep synthetic renders small; production dimensions are tested separately.
    manifest.dimensions = { width: 320, height: 180 };
    const otioFile = path.join(dir, "edit.otio");
    fs.writeFileSync(otioFile, JSON.stringify(otio));
    const parser = spawnSync(
      "python",
      [
        "-c",
        'import sys;sys.path.insert(0,sys.argv[1]);import opentimelineio as o;t=o.adapters.read_from_file(sys.argv[2]);assert t.duration().to_seconds()==2;assert len(list(t.find_clips()))==2;assert list(t.find_clips())[0].source_range.start_time.to_seconds()==1;print("OTIO parsed")',
        path.resolve(".local/otio"),
        otioFile,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    expect(parser.stderr).toBe("");
    expect(parser.status).toBe(0);
    for (let index = 0; index < 2; index++) {
      const file = path.join(dir, manifest.clips[index].sourceFilename);
      const args = ["-f", "lavfi", "-i", "color=c=green:s=320x180:r=24:d=3"];
      if (index)
        args.push("-f", "lavfi", "-i", "sine=frequency=880:duration=3");
      args.push("-c:v", "libx264", "-pix_fmt", "yuv420p");
      if (index) args.push("-c:a", "aac", "-shortest");
      args.push(file);
      await runFfmpeg(ffmpeg, args);
    }
    const packageFile = path.join(dir, "delivery.json");
    fs.writeFileSync(packageFile, JSON.stringify({ manifest, otio }));
    const rendered = spawnSync(
      process.execPath,
      ["scripts/studio-render.cjs", packageFile, dir],
      { encoding: "utf8", windowsHide: true, timeout: 30000 },
    );
    expect(rendered.stderr).toBe("");
    expect(rendered.status).toBe(0);
    const info = await inspectMedia(ffmpeg, path.join(dir, "film.mp4"));
    expect(info.audio).toBe(true);
    expect(info.seconds).toBeGreaterThanOrEqual(2);
    expect(info.seconds).toBeLessThan(2.2);
  } finally {
    if (!dir.startsWith(root + path.sep))
      throw new Error("Unsafe temporary path");
    fs.rmSync(dir, { recursive: true, force: true });
  }
}, 40000);
