// Capa é só uma miniatura de card, não uma imagem de detalhe — cabe em bem
// menos que a resolução do vídeo (até 1280px). Isso é o que mantém o
// download da Home leve: pesa ~10x menos que extrair no tamanho nativo.
const THUMBNAIL_MAX_DIMENSION = 640;
const THUMBNAIL_QUALITY = 0.72;

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
        const scale = Math.min(
          1,
          THUMBNAIL_MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) {
          clearTimeout(timeout);
          return finish(null);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            finish(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null);
          },
          "image/jpeg",
          THUMBNAIL_QUALITY,
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
