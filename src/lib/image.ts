import { isNative } from './platform';

/** Images users pick or take, before compression. Larger files are refused with a clear message. */
export const MAX_IMAGE_INPUT_BYTES = 20 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i;

export type ImageError = 'unsupported_format' | 'too_large' | 'decode_failed' | 'permission_denied' | 'cancelled' | 'no_camera';

export class ImageInputError extends Error {
  constructor(readonly code: ImageError) {
    super(code);
  }
}

export interface PreparedImage {
  blob: Blob;
  base64: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
}

export function validateImageFile(file: Blob): void {
  const type = file.type || '';
  const heicByName = file instanceof File && /\.(heic|heif)$/i.test(file.name);
  if (!ACCEPTED.test(type) && !heicByName) throw new ImageInputError('unsupported_format');
  if (file.size > MAX_IMAGE_INPUT_BYTES) throw new ImageInputError('too_large');
}

async function decode(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall back to <img>, which also decodes HEIC on Safari */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new ImageInputError('decode_failed');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new ImageInputError('decode_failed'));
    r.readAsDataURL(blob);
  });
}

/**
 * Validates, decodes (HEIC works where the browser can decode it; otherwise a clear error), optionally crops to a
 * centred square, scales the longest side to `maxSide` and re-encodes as JPEG. EXIF (including location) is
 * dropped by re-encoding.
 */
export async function prepareImage(file: Blob, opts: { maxSide?: number; quality?: number; square?: boolean; crop?: { x: number; y: number; size: number } } = {}): Promise<PreparedImage> {
  validateImageFile(file);
  const src = await decode(file);
  const maxSide = opts.maxSide ?? 1280;
  let sx = 0;
  let sy = 0;
  let sw = src.width;
  let sh = src.height;
  if (opts.crop) {
    sx = opts.crop.x;
    sy = opts.crop.y;
    sw = sh = opts.crop.size;
  } else if (opts.square) {
    const s = Math.min(sw, sh);
    sx = (sw - s) / 2;
    sy = (sh - s) / 2;
    sw = sh = s;
  }
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageInputError('decode_failed');
  ctx.fillStyle = '#FFFFFF'; // transparent PNGs become white, not black, as JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, width, height);
  if ('close' in src && typeof src.close === 'function') src.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageInputError('decode_failed'))), 'image/jpeg', opts.quality ?? 0.82),
  );
  return { blob, base64: await blobToBase64(blob), mimeType: 'image/jpeg', width, height };
}

/** Native camera or photo library (Capacitor). Returns null when the user cancels. */
export async function pickNativePhoto(source: 'camera' | 'photos'): Promise<Blob | null> {
  if (!isNative()) throw new ImageInputError('no_camera');
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  try {
    const perm = await Camera.requestPermissions({ permissions: [source === 'camera' ? 'camera' : 'photos'] });
    const state = source === 'camera' ? perm.camera : perm.photos;
    if (state === 'denied') throw new ImageInputError('permission_denied');
    const photo = await Camera.getPhoto({
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.DataUrl,
      quality: 85,
      width: 1600,
      correctOrientation: true,
      saveToGallery: false,
    });
    if (!photo.dataUrl) return null;
    return await (await fetch(photo.dataUrl)).blob();
  } catch (e) {
    if (e instanceof ImageInputError) throw e;
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    if (msg.includes('cancel')) return null;
    if (msg.includes('denied') || msg.includes('permission')) throw new ImageInputError('permission_denied');
    throw new ImageInputError('decode_failed');
  }
}
