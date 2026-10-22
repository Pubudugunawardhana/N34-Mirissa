// Moves every photo the database points at inside the project to Cloudinary: sample photos in public/images
// (rooms, and the beach photos used as placeholders for meals, dinners and experiences) and anything uploaded
// while Cloudinary was not set up (public/uploads). Each row gets its own Cloudinary copy, so replacing or
// deleting one in the admin never removes a photo another row still uses.
//
//   npm run photos:to-cloud            move them
//   npm run photos:to-cloud -- --dry   only list what would move
//
// Safe to run again: rows that already point at Cloudinary are skipped.

import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const DRY_RUN = process.argv.includes('--dry');
const CLOUDINARY_ROOT = 'n34-mirissa';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Every table with a photo: where the link is, where its Cloudinary id goes, and the upload folder (as in src/lib/uploads.ts).
const TABLES = [
  { model: 'roomImage', url: 'url', publicId: 'publicId', kind: 'rooms' },
  { model: 'user', url: 'image', publicId: 'imagePublicId', kind: 'avatars' },
  { model: 'mealService', url: 'imageUrl', publicId: 'imagePublicId', kind: 'dining' },
  { model: 'diningExperience', url: 'imageUrl', publicId: 'imagePublicId', kind: 'dining' },
  { model: 'diningPhoto', url: 'url', publicId: 'publicId', kind: 'dining' },
  { model: 'experience', url: 'imageUrl', publicId: 'imagePublicId', kind: 'experiences' },
];

// Links inside the project. The files in public/images stay: the website's own pages (hero, sign-in) use them too.
const MOVABLE = ['/images/', '/uploads/'];

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary is not set up: fill in CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env first.');
  process.exit(1);
}
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });

const prisma = new PrismaClient();
let moved = 0;
let missing = 0;
let failed = 0;

for (const table of TABLES) {
  const rows = await prisma[table.model].findMany({
    where: { OR: MOVABLE.map((prefix) => ({ [table.url]: { startsWith: prefix } })) },
    select: { id: true, [table.url]: true },
  });

  for (const row of rows) {
    const url = row[table.url];
    const file = path.join(PUBLIC_DIR, ...url.split('/').filter(Boolean));
    if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) {
      console.warn(`  missing file, skipped: ${url}`);
      missing++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`  would move ${table.model} ${url}`);
      moved++;
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(file, { folder: `${CLOUDINARY_ROOT}/${table.kind}`, resource_type: 'image' });
      await prisma[table.model].update({ where: { id: row.id }, data: { [table.url]: result.secure_url, [table.publicId]: result.public_id } });
      // An uploaded copy in public/uploads is no longer needed; the sample photos in public/images stay for new databases.
      if (url.startsWith('/uploads/')) await unlink(file);
      console.log(`  moved ${url} -> ${result.secure_url}`);
      moved++;
    } catch (error) {
      console.error(`  failed ${url}: ${error.message ?? error}`);
      failed++;
    }
  }
}

console.log(`${DRY_RUN ? 'Would move' : 'Moved'} ${moved} photo(s); ${missing} missing file(s); ${failed} failed.`);
await prisma.$disconnect();
if (failed > 0) process.exit(1);
