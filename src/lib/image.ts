/** Nén ảnh phía client trước khi upload (giảm dung lượng 3G/4G). */
export async function compressImage(file: File, maxSize = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  let w: number, h: number, source: CanvasImageSource;
  if (bitmap) {
    w = bitmap.width; h = bitmap.height; source = bitmap;
  } else {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    w = img.naturalWidth; h = img.naturalHeight; source = img;
    URL.revokeObjectURL(url);
  }
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Không nén được ảnh"))), "image/jpeg", quality));
}
