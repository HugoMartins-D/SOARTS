import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const CORE_VERSION = "0.12.9";
// The `esm` build is required (not `umd`): ffmpeg.wasm's worker runs as an ES
// module under Vite, and importing a non-ESM core script there silently fails.
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

// Above this, ffmpeg.wasm's in-memory (single-threaded) filesystem risks
// running the browser tab out of memory. Skip compression and upload as-is.
const MAX_COMPRESSIBLE_BYTES = 600 * 1024 * 1024;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

/**
 * Re-encodes a video in the browser (H.264/AAC, longest edge capped at
 * 1280px) before it's uploaded, so what ends up hosted is the reduced
 * version rather than the raw camera/phone file. Falls back to the original
 * file whenever ffmpeg.wasm can't load or the transcode fails/doesn't shrink
 * the file, so a failed compression never blocks the upload itself.
 */
export async function compressVideo(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<File> {
  if (file.size > MAX_COMPRESSIBLE_BYTES) {
    console.warn("Vídeo grande demais para comprimir no navegador, enviando original.");
    return file;
  }

  const inputName = `input-${crypto.randomUUID()}.${file.name.split(".").pop() || "mov"}`;
  const outputName = `output-${crypto.randomUUID()}.mp4`;
  let ffmpeg: FFmpeg;

  try {
    ffmpeg = await getFFmpeg();
  } catch (err) {
    console.error("Falha ao carregar o compressor de vídeo, enviando original:", err);
    return file;
  }

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on("progress", handleProgress);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const bytes = data as Uint8Array;
    if (!bytes.byteLength) return file;

    const compressed = new File(
      [bytes],
      file.name.replace(/\.[^.]+$/, "") + ".mp4",
      { type: "video/mp4" },
    );

    return compressed.size < file.size ? compressed : file;
  } catch (err) {
    console.error("Falha ao comprimir vídeo, enviando original:", err);
    return file;
  } finally {
    ffmpeg.off("progress", handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
