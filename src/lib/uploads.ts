import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Each kind of upload gets its own folder, both on Cloudinary and in the local fallback.
type UploadKind = 'rooms' | 'avatars' | 'dining';

const LOCAL_ROOT = path.join(process.cwd(), 'public', 'uploads');
const LOCAL_URL_ROOT = '/uploads/';
const CLOUDINARY_ROOT = 'n34-mirissa';

type StoredImage = { url: string; publicId: string | null };

function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

// Returns an error message, or null when the file can be uploaded.
export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES[file.type]) return `"${file.name}" is not a JPEG, PNG or WebP image.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is larger than 5 MB.`;
  return null;
}

async function uploadImage(file: File, kind: UploadKind): Promise<StoredImage> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `${CLOUDINARY_ROOT}/${kind}`, resource_type: 'image' }, (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        })
        .end(buffer);
    });
  }

  // Cloudinary is not configured yet: keep the file in the project so uploads still work locally.
  const fileName = `${randomBytes(12).toString('hex')}.${ALLOWED_TYPES[file.type]}`;
  await mkdir(path.join(LOCAL_ROOT, kind), { recursive: true });
  await writeFile(path.join(LOCAL_ROOT, kind, fileName), buffer);
  return { url: `${LOCAL_URL_ROOT}${kind}/${fileName}`, publicId: null };
}

// Best effort: a file that is already gone must not block deleting its database row.
async function removeImageFile(image: StoredImage, kind: UploadKind) {
  try {
    if (image.publicId) {
      if (isCloudinaryConfigured()) await cloudinary.uploader.destroy(image.publicId);
    } else if (image.url.startsWith(`${LOCAL_URL_ROOT}${kind}/`)) {
      // basename: only ever a file directly inside this kind's folder, whatever the stored URL says.
      await unlink(path.join(LOCAL_ROOT, kind, path.basename(image.url)));
    }
  } catch (error) {
    console.error('Failed to remove uploaded image', error);
  }
}

export const uploadRoomImage = (file: File) => uploadImage(file, 'rooms');
export const removeRoomImageFile = (image: StoredImage) => removeImageFile(image, 'rooms');

export const uploadAvatar = (file: File) => uploadImage(file, 'avatars');
export const removeAvatarFile = (image: StoredImage) => removeImageFile(image, 'avatars');

export const uploadDiningImage = (file: File) => uploadImage(file, 'dining');
export const removeDiningImageFile = (image: StoredImage) => removeImageFile(image, 'dining');
