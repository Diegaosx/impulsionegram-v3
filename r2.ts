import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-compatible. Credentials come from environment variables
// (configured as Railway variables), never from the database.
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
// Public base URL where the bucket objects are served (R2 public bucket or
// custom domain), e.g. https://cdn.example.com or https://pub-xxxx.r2.dev
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET_NAME && PUBLIC_URL);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      // R2's TLS wildcard cert only covers *.r2.cloudflarestorage.com, so the
      // default virtual-hosted style (<bucket>.<account>.r2...) fails the TLS
      // handshake. Path-style keeps the bucket in the path instead.
      forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY
      }
    });
  }
  return client;
}

/**
 * Upload a file buffer to R2 and return its public URL.
 * @param key destination object key (path inside the bucket)
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, ' +
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME and CLOUDFLARE_R2_PUBLIC_URL.'
    );
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );

  return `${PUBLIC_URL}/${key}`;
}
