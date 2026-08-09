/**
 * Extrai um frame do vídeo no navegador pra usar como capa automática
 * quando o admin não envia uma. Sem uma capa de verdade, o card depende do
 * navegador buscar um frame sozinho (`preload="metadata"`), o que é
 * inconsistente no mobile — isso garante uma imagem real toda vez.
 * Retorna `null` (nunca rejeita) se o vídeo não puder ser lido a tempo.
 */
export async function extractVideoFrame(file: File, atSeconds = 1): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const url = URL.createObjectURL(file);
    video.src = url;

    let settled = false;
    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.remove();
      resolve(result);
    };

    const timeout = setTimeout(() => finish(null), 8000);

    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : atSeconds;
      video.currentTime = Math.min(atSeconds, Math.max(0, duration - 0.1));
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) {
          clearTimeout(timeout);
          return finish(null);
        }
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            finish(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null);
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        console.error("Falha ao extrair frame do vídeo:", err);
        clearTimeout(timeout);
        finish(null);
      }
    });

    video.addEventListener("error", () => {
      clearTimeout(timeout);
      finish(null);
    });
  });
}
