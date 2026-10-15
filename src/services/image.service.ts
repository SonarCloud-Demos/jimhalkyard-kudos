import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NotFoundError, ValidationError } from '../utils/errors';

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;
const FORM_OVERHEAD_KILOBYTES = 100;

export const MAX_IMAGE_BYTES = 2 * BYTES_PER_MEGABYTE;
export const MAX_UPLOAD_REQUEST_BYTES =
  MAX_IMAGE_BYTES + FORM_OVERHEAD_KILOBYTES * BYTES_PER_KILOBYTE;

type ImageExtension = 'png' | 'jpg';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const JPEG_SIGNATURE = Buffer.from('ffd8ff', 'hex');

const CONTENT_TYPES: Record<ImageExtension, string> = { png: 'image/png', jpg: 'image/jpeg' };

interface StoredImage {
  file: Blob;
  contentType: string;
}

const STORED_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg)$/;

function hasSignature(bytes: Uint8Array, signature: Buffer): boolean {
  return Buffer.from(bytes.subarray(0, signature.length)).equals(signature);
}

export function detectImageExtension(bytes: Uint8Array): ImageExtension | null {
  if (hasSignature(bytes, PNG_SIGNATURE)) {
    return 'png';
  }
  if (hasSignature(bytes, JPEG_SIGNATURE)) {
    return 'jpg';
  }
  return null;
}

function getUploadDirectory(): string {
  const directory = resolve(process.env.UPLOAD_DIR || './uploads');
  mkdirSync(directory, { recursive: true });
  return directory;
}

function resolveStoredPath(filename: string): string {
  if (!STORED_NAME_PATTERN.test(filename)) {
    throw new NotFoundError('Image not found');
  }
  return join(getUploadDirectory(), filename);
}

/**
 * Validates an uploaded image (PNG or JPG, at most 2MB) and stores it on disk
 * under a generated name. The client-supplied file name is never used.
 * Returns the stored file name.
 */
export async function saveImage(file: File): Promise<string> {
  if (file.size === 0) {
    throw new ValidationError('Image file is empty');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError('Image must not exceed 2MB');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = detectImageExtension(bytes);

  if (!extension) {
    throw new ValidationError('Only PNG and JPG images are allowed');
  }

  const filename = `${randomUUID()}.${extension}`;
  await Bun.write(resolveStoredPath(filename), bytes);

  return filename;
}

/** Saves the image when one was uploaded; returns null when there is none. */
export async function saveOptionalImage(image: File | null): Promise<string | null> {
  if (!image) {
    return null;
  }
  return saveImage(image);
}

export async function getStoredImage(filename: string): Promise<StoredImage> {
  const file = Bun.file(resolveStoredPath(filename));

  if (!(await file.exists())) {
    throw new NotFoundError('Image not found');
  }

  // resolveStoredPath has already verified the extension is png or jpg
  const extension = filename.slice(filename.lastIndexOf('.') + 1) as ImageExtension;
  return { file, contentType: CONTENT_TYPES[extension] };
}

export async function deleteImage(filename: string): Promise<void> {
  try {
    await unlink(resolveStoredPath(filename));
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
