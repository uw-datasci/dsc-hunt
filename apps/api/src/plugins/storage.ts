/**
 * Riddle image storage on Neon Object Storage (S3-compatible; path-style
 * addressing and SigV4 only - see neon.com/docs/storage). Decorates
 * `fastify.storage`, or null when the storage env vars aren't all set,
 * so the rest of the API still runs and image routes answer 503.
 *
 * Also registers @fastify/multipart for the admin image upload.
 */
import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Largest riddle image accepted, in bytes (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Signed image URLs live briefly: the stable image routes mint a new one per request. */
export const SIGNED_URL_SECONDS = 5 * 60;

/** The few object operations riddle images need; tests swap in a fake. */
export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** A presigned GET URL that works for `seconds`. */
  signedGetUrl(key: string, seconds: number): Promise<string>;
}

export function createS3Storage(config: {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}): ObjectStorage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
    // Neon's guidance: avoids checksum failures on presigned/empty-body requests.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  const Bucket = config.bucket;

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Keys are unique per upload, so the browser can cache aggressively.
          CacheControl: "private, max-age=31536000, immutable",
        })
      );
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },
    signedGetUrl(key, seconds) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket, Key: key }), {
        expiresIn: seconds,
      });
    },
  };
}

export async function registerStorage(fastify: FastifyInstance) {
  const {
    AWS_ENDPOINT_URL_S3: endpoint,
    AWS_REGION: region,
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    S3_BUCKET: bucket,
  } = fastify.config;

  const configured = [endpoint, region, accessKeyId, secretAccessKey, bucket].every(
    (value) => value.trim().length > 0
  );
  if (!configured) {
    fastify.log.warn("AWS_* / S3_BUCKET not fully set; riddle images are disabled");
  }
  fastify.decorate(
    "storage",
    configured
      ? createS3Storage({
          endpoint: endpoint.trim(),
          region: region.trim(),
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          bucket: bucket.trim(),
        })
      : null
  );

  // One file per request; the limit is enforced while streaming.
  await fastify.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });
}
