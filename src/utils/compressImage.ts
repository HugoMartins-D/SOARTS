const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

/**
 * Reduz o tamanho de uma foto no navegador antes do upload: redimensiona
 * pro lado maior caber em 2000px e recodifica como JPEG. Fotos de câmera de
 * celular hoje chegam a 12-16MB e demoram muito pra carregar no site,
 * principalmente no mobile — isso é o que resolve. Cai pro arquivo original
 * se a compressão falhar ou não reduzir o tamanho.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const compressed = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".jpg",
      { type: "image/jpeg" },
    );

    return compressed.size < file.size ? compressed : file;
  } catch (err) {
    console.error("Falha ao comprimir foto, enviando original:", err);
    return file;
  }
}
